begin;
select plan(33);

-- Impersonation helpers. Roles are switched with set_config so each test can undo it with `reset role`.
create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{}', true);
  perform set_config('role', 'anon', true);
end $$;

-- Invented data. A manages G1, B is a member of G1, C manages G2 and is not in G1.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'a@pgtap.test'),
  ('b0000000-0000-0000-0000-00000000000b', 'b@pgtap.test'),
  ('c0000000-0000-0000-0000-00000000000c', 'c@pgtap.test');
insert into public.profiles (id, display_name) values
  ('a0000000-0000-0000-0000-00000000000a', 'Anna'),
  ('b0000000-0000-0000-0000-00000000000b', 'Luca'),
  ('c0000000-0000-0000-0000-00000000000c', 'Sara');
insert into public.groups (id, name, time_zone, created_by) values
  ('11111111-1111-1111-1111-111111111111', 'G1', 'Europe/Rome', 'a0000000-0000-0000-0000-00000000000a'),
  ('22222222-2222-2222-2222-222222222222', 'G2', 'Europe/Rome', 'c0000000-0000-0000-0000-00000000000c');
insert into public.group_members (group_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-00000000000a', 'manager'),
  ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'member'),
  ('22222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-00000000000c', 'manager');
insert into public.shift_types (group_id, code, label, start_time, duration_minutes) values
  ('11111111-1111-1111-1111-111111111111', 'M', 'Mattina', '06:00', 480),
  ('11111111-1111-1111-1111-111111111111', 'N', 'Notte', '22:00', 480);
insert into public.shifts (id, group_id, user_id, code, starts_at, ends_at) values
  ('51111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'b0000000-0000-0000-0000-00000000000b', 'M', '2026-10-21T04:00:00Z', '2026-10-21T12:00:00Z');

-- Anonymous: no grants at all.
select pg_temp.act_as_anon();
select throws_ok('select * from public.groups', '42501', null, 'anon cannot read groups');
select throws_ok('select * from public.shifts', '42501', null, 'anon cannot read shifts');
reset role;

-- B, member of G1: reads the group, writes nothing.
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.groups), 1::bigint, 'B sees only G1');
select is((select count(*) from public.group_members), 2::bigint, 'B sees the members of G1');
select is((select count(*) from public.shift_types), 2::bigint, 'B sees the shift types of G1');
select is((select count(*) from public.shifts), 1::bigint, 'B sees the shifts of G1');
select is((select count(*) from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a'), 1::bigint,
  'B reads the profile of A, who shares a group');
reset role;

-- C, not in G1: sees nothing of it.
select pg_temp.act_as('c0000000-0000-0000-0000-00000000000c');
select is((select count(*) from public.groups where id = '11111111-1111-1111-1111-111111111111'), 0::bigint, 'C cannot see G1');
select is((select count(*) from public.shifts where group_id = '11111111-1111-1111-1111-111111111111'), 0::bigint, 'C cannot see shifts of G1');
select is((select count(*) from public.group_members where group_id = '11111111-1111-1111-1111-111111111111'), 0::bigint, 'C cannot see members of G1');
select is((select count(*) from public.profiles where id = 'b0000000-0000-0000-0000-00000000000b'), 0::bigint,
  'C cannot read the profile of B, who shares no group');
select throws_ok(
  $$insert into public.group_members (group_id, user_id, role)
    values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-00000000000c', 'member')$$,
  '42501', null, 'C cannot join G1 by inserting a membership');
reset role;

-- B tries to write: the statements run, the rows stay as they were.
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select throws_ok(
  $$insert into public.shifts (group_id, user_id, code, starts_at, ends_at)
    values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'N',
            '2026-10-22T20:00:00Z', '2026-10-23T04:00:00Z')$$,
  '42501', null, 'B cannot create a shift');
select lives_ok($$update public.shifts set code = 'N' where id = '51111111-1111-1111-1111-111111111111'$$, 'B update runs');
reset role;
select is((select code from public.shifts where id = '51111111-1111-1111-1111-111111111111'), 'M', 'B did not change the shift');
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select lives_ok($$delete from public.shifts where id = '51111111-1111-1111-1111-111111111111'$$, 'B delete runs');
reset role;
select is((select count(*) from public.shifts where group_id = '11111111-1111-1111-1111-111111111111'), 1::bigint, 'B did not delete the shift');
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select lives_ok(
  $$update public.group_members set role = 'manager' where user_id = 'b0000000-0000-0000-0000-00000000000b'$$, 'B promotion runs');
select lives_ok(
  $$update public.group_members set role = 'member' where user_id = 'a0000000-0000-0000-0000-00000000000a'$$, 'B demotion of A runs');
reset role;
select is((select role from public.group_members where user_id = 'b0000000-0000-0000-0000-00000000000b'), 'member', 'B is still a member');
select is((select role from public.group_members where user_id = 'a0000000-0000-0000-0000-00000000000a'
           and group_id = '11111111-1111-1111-1111-111111111111'), 'manager', 'A is still the manager');

-- A, manager of G1.
select pg_temp.act_as('a0000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$insert into public.shifts (group_id, user_id, code, starts_at, ends_at)
    values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'N',
            '2026-10-22T20:00:00Z', '2026-10-23T04:00:00Z')$$, 'A creates a shift for B');
select is((select count(*) from public.shifts where group_id = '11111111-1111-1111-1111-111111111111'), 2::bigint, 'the new shift is there');
select throws_ok(
  $$update public.shifts set group_id = '22222222-2222-2222-2222-222222222222' where id = '51111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'A cannot move a shift into G2');
select throws_ok(
  $$update public.shifts set user_id = 'a0000000-0000-0000-0000-00000000000a' where id = '51111111-1111-1111-1111-111111111111'$$,
  '42501', null, 'A cannot reassign a shift to another member');
select throws_ok(
  $$update public.shift_types set label = repeat('x', 61) where group_id = '11111111-1111-1111-1111-111111111111' and code = 'M'$$,
  '23514', null, 'a shift type label has a length limit');
select throws_ok(
  $$update public.groups set time_zone = 'Not/AZone' where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'a group needs a real time zone');
select throws_ok(
  $$insert into public.shifts (group_id, user_id, code, starts_at, ends_at)
    values ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-00000000000c', 'M',
            '2026-10-24T04:00:00Z', '2026-10-24T12:00:00Z')$$,
  '23503', null, 'a shift needs a member of the group');
select throws_ok(
  $$insert into public.shifts (group_id, user_id, code, starts_at, ends_at)
    values ('11111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-00000000000b', 'M',
            '2026-10-21T04:00:00Z', '2026-10-21T12:00:00Z')$$,
  '23505', null, 'the same member cannot start two shifts at the same time');
select throws_ok(
  $$delete from public.group_members where user_id = 'a0000000-0000-0000-0000-00000000000a'
    and group_id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'the last manager cannot leave');
select throws_ok(
  $$update public.group_members set role = 'member' where user_id = 'a0000000-0000-0000-0000-00000000000a'
    and group_id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'the last manager cannot be demoted');
reset role;

-- A former member loses access at once.
delete from public.group_members where user_id = 'b0000000-0000-0000-0000-00000000000b'
  and group_id = '11111111-1111-1111-1111-111111111111';
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.shifts where group_id = '11111111-1111-1111-1111-111111111111'), 0::bigint,
  'B sees nothing of G1 after leaving');
reset role;

select hasnt_column('public', 'profiles', 'email', 'profiles carries no email');

select * from finish();
rollback;
