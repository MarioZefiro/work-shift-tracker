-- Access rules. Role lives in group_members.role (not in the token), so a role change applies at once.

create schema private;
grant usage on schema private to authenticated;

-- security definer so policies can read group_members without recursing into its own policies.
create function private.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  )
$$;

create function private.is_manager(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid()) and m.role = 'manager'
  )
$$;

create function private.shares_group(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.group_members mine
    join public.group_members theirs on theirs.group_id = mine.group_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other
  )
$$;

revoke all on function private.is_member(uuid), private.is_manager(uuid), private.shares_group(uuid) from public;
grant execute on function private.is_member(uuid), private.is_manager(uuid), private.shares_group(uuid) to authenticated;

-- A group never ends up without a manager. It still allows deleting the whole group.
create function private.keep_a_manager() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'manager'
     and (tg_op = 'DELETE' or new.role <> 'manager')
     and exists (select 1 from public.groups g where g.id = old.group_id)
     and not exists (
       select 1 from public.group_members m
       where m.group_id = old.group_id and m.role = 'manager' and m.user_id <> old.user_id
     )
  then
    raise exception 'a group needs at least one manager' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;

create trigger group_members_keep_a_manager
  before update of role or delete on public.group_members
  for each row execute function private.keep_a_manager();

-- Nothing is open by default: anon gets nothing, authenticated only what the policies allow.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.shift_types enable row level security;
alter table public.shifts enable row level security;

-- Column-level update grants stop a manager from rewriting keys such as user_id or group_id.
grant select, insert on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.groups to authenticated;
grant update (name, time_zone) on public.groups to authenticated;
grant delete on public.groups to authenticated;
grant select, delete on public.group_members to authenticated;
grant update (role) on public.group_members to authenticated;
grant select, delete on public.group_invites to authenticated;
grant update (revoked_at) on public.group_invites to authenticated;
grant select, insert, delete on public.shift_types to authenticated;
grant update (label, start_time, duration_minutes) on public.shift_types to authenticated;
grant select, insert, delete on public.shifts to authenticated;
grant update (user_id, code, starts_at, ends_at, group_id) on public.shifts to authenticated;

-- profiles: your own, plus people you share a group with. No email column exists.
create policy "profiles: read own or shared" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_group(id));
create policy "profiles: create own" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- groups are created through a function (next migration), never by a plain insert.
create policy "groups: members read" on public.groups for select to authenticated
  using (private.is_member(id));
create policy "groups: managers update" on public.groups for update to authenticated
  using (private.is_manager(id)) with check (private.is_manager(id));
create policy "groups: managers delete" on public.groups for delete to authenticated
  using (private.is_manager(id));

-- Joining goes through accept_invite, so there is no insert policy on group_members.
create policy "members: read own group" on public.group_members for select to authenticated
  using (private.is_member(group_id));
create policy "members: managers change role" on public.group_members for update to authenticated
  using (private.is_manager(group_id)) with check (private.is_manager(group_id));
create policy "members: managers remove, anyone leaves" on public.group_members for delete to authenticated
  using (private.is_manager(group_id) or user_id = (select auth.uid()));

create policy "invites: managers read" on public.group_invites for select to authenticated
  using (private.is_manager(group_id));
create policy "invites: managers revoke" on public.group_invites for update to authenticated
  using (private.is_manager(group_id)) with check (private.is_manager(group_id));
create policy "invites: managers delete" on public.group_invites for delete to authenticated
  using (private.is_manager(group_id));

create policy "shift types: members read" on public.shift_types for select to authenticated
  using (private.is_member(group_id));
create policy "shift types: managers insert" on public.shift_types for insert to authenticated
  with check (private.is_manager(group_id));
create policy "shift types: managers update" on public.shift_types for update to authenticated
  using (private.is_manager(group_id)) with check (private.is_manager(group_id));
create policy "shift types: managers delete" on public.shift_types for delete to authenticated
  using (private.is_manager(group_id));

create policy "shifts: members read" on public.shifts for select to authenticated
  using (private.is_member(group_id));
create policy "shifts: managers insert" on public.shifts for insert to authenticated
  with check (private.is_manager(group_id));
create policy "shifts: managers update" on public.shifts for update to authenticated
  using (private.is_manager(group_id)) with check (private.is_manager(group_id));
create policy "shifts: managers delete" on public.shifts for delete to authenticated
  using (private.is_manager(group_id));
