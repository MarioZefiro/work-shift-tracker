-- Least privilege on shifts: a shift keeps its owner and group for life; managers change only what, when.
revoke update on public.shifts from authenticated;
grant update (code, starts_at, ends_at) on public.shifts to authenticated;

alter table public.shift_types add constraint shift_types_label_length check (char_length(label) between 1 and 60);

-- A check constraint cannot query pg_timezone_names, so a trigger does it. A bad zone would break the calendar for every member.
create function private.check_time_zone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone) then
    raise exception 'unknown time zone: %', new.time_zone using errcode = 'check_violation';
  end if;
  return new;
end $$;

revoke all on function private.check_time_zone() from public;

create trigger groups_check_time_zone before insert or update of time_zone on public.groups
  for each row execute function private.check_time_zone();
