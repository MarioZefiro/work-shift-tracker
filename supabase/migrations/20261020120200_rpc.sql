-- Functions that change membership. A client never inserts into groups, group_members or
-- group_invites directly: these run as the owner and check everything themselves.

create function public.create_group(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  gid uuid;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  insert into public.groups (name, created_by) values (p_name, uid) returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, uid, 'manager');
  insert into public.shift_types (group_id, code, label, start_time, duration_minutes) values
    (gid, 'M', 'Mattina', '06:00', 480),
    (gid, 'P', 'Pomeriggio', '14:00', 480),
    (gid, 'N', 'Notte', '22:00', 480),
    (gid, 'R', 'Riposo', '00:00', 1440);
  return gid;
end $$;

-- Returns the code once. Only its sha256 hash is stored, so a database leak does not leak invites.
create function public.create_invite(p_group_id uuid, p_max_uses int default 1, p_days int default 7) returns text
language plpgsql security definer set search_path = '' as $$
declare
  code text;
begin
  if not private.is_manager(p_group_id) then raise exception 'not a manager' using errcode = '42501'; end if;
  if p_max_uses not between 1 and 30 or p_days not between 1 and 30 then
    raise exception 'invalid invite settings' using errcode = '22023';
  end if;
  if (select count(*) from public.group_invites
      where group_id = p_group_id and revoked_at is null and expires_at > now() and uses < max_uses) >= 10 then
    raise exception 'too many active invites' using errcode = 'P0001';
  end if;
  code := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.group_invites (group_id, code_hash, expires_at, max_uses, created_by)
    values (p_group_id, encode(extensions.digest(code, 'sha256'), 'hex'),
            now() + make_interval(days => p_days), p_max_uses, (select auth.uid()));
  return code;
end $$;

-- Name and head count only: no shifts, no member names.
create function public.preview_invite(p_code text) returns table (group_name text, member_count int)
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'not signed in' using errcode = '42501'; end if;
  return query
    select g.name, (select count(*)::int from public.group_members m where m.group_id = g.id)
    from public.group_invites i
    join public.groups g on g.id = i.group_id
    where i.code_hash = encode(extensions.digest(p_code, 'sha256'), 'hex')
      and i.revoked_at is null and i.expires_at > now() and i.uses < i.max_uses;
  -- One message for unknown, expired, revoked and used up, so a guesser learns nothing.
  if not found then raise exception 'invalid invite' using errcode = 'P0002'; end if;
end $$;

create function public.accept_invite(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  inv public.group_invites;
begin
  if uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  -- The row lock makes two people racing for a single-use invite take turns.
  select * into inv from public.group_invites
    where code_hash = encode(extensions.digest(p_code, 'sha256'), 'hex') for update;
  if not found then raise exception 'invalid invite' using errcode = 'P0002'; end if;
  -- A second click by someone already inside gets the same answer as the first.
  if exists (select 1 from public.group_members where group_id = inv.group_id and user_id = uid) then
    return inv.group_id;
  end if;
  if inv.revoked_at is not null or inv.expires_at <= now() or inv.uses >= inv.max_uses then
    raise exception 'invalid invite' using errcode = 'P0002';
  end if;
  if (select count(*) from public.group_members where group_id = inv.group_id) >= 30 then
    raise exception 'group is full' using errcode = 'P0001';
  end if;
  insert into public.group_members (group_id, user_id, role) values (inv.group_id, uid, 'member');
  update public.group_invites set uses = uses + 1 where id = inv.id;
  return inv.group_id;
end $$;

revoke all on function public.create_group(text), public.create_invite(uuid, int, int),
  public.preview_invite(text), public.accept_invite(text) from public, anon;
grant execute on function public.create_group(text), public.create_invite(uuid, int, int),
  public.preview_invite(text), public.accept_invite(text) to authenticated;
