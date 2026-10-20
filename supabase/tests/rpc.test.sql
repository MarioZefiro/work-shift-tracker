begin;
select plan(24);

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

-- Invented users: A creates the group, B and C join, D only creates a second group.
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'a@pgtap.test'),
  ('b0000000-0000-0000-0000-00000000000b', 'b@pgtap.test'),
  ('c0000000-0000-0000-0000-00000000000c', 'c@pgtap.test'),
  ('d0000000-0000-0000-0000-00000000000d', 'd@pgtap.test');
insert into public.profiles (id, display_name) values
  ('a0000000-0000-0000-0000-00000000000a', 'Anna'),
  ('b0000000-0000-0000-0000-00000000000b', 'Luca'),
  ('c0000000-0000-0000-0000-00000000000c', 'Sara'),
  ('d0000000-0000-0000-0000-00000000000d', 'Dario');

-- create_group: the caller becomes manager and gets the four default shift types.
select pg_temp.act_as('a0000000-0000-0000-0000-00000000000a');
select set_config('test.gid', public.create_group('Reparto')::text, true);
select is((select role from public.group_members where user_id = 'a0000000-0000-0000-0000-00000000000a'
           and group_id = current_setting('test.gid')::uuid), 'manager', 'the creator is the manager');
select is((select count(*) from public.shift_types where group_id = current_setting('test.gid')::uuid), 4::bigint,
  'the group starts with M, P, N and R');
select throws_ok($$select public.create_group('')$$, '23514', null, 'an empty group name is rejected');

-- create_invite: the code is returned once and only its hash is stored.
select set_config('test.code', public.create_invite(current_setting('test.gid')::uuid), true);
select is(length(current_setting('test.code')), 48, 'the code is 48 hex characters (192 bits)');
reset role;
select is((select count(*) from public.group_invites where code_hash = current_setting('test.code')), 0::bigint,
  'the plain code is not stored');
select is((select count(*) from public.group_invites
           where code_hash = encode(extensions.digest(current_setting('test.code'), 'sha256'), 'hex')), 1::bigint,
  'the sha256 hash of the code is stored');

-- A plain member cannot create invites.
insert into public.group_members (group_id, user_id, role)
  values (current_setting('test.gid')::uuid, 'b0000000-0000-0000-0000-00000000000b', 'member');
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select throws_ok(format($$select public.create_invite(%L)$$, current_setting('test.gid')), '42501', null,
  'a member cannot create an invite');
reset role;
delete from public.group_members where user_id = 'b0000000-0000-0000-0000-00000000000b';

-- preview_invite shows the group name and the member count only.
select pg_temp.act_as('c0000000-0000-0000-0000-00000000000c');
select results_eq(
  format($$select group_name, member_count from public.preview_invite(%L)$$, current_setting('test.code')),
  $$values ('Reparto'::text, 1)$$,
  'the preview shows name and member count');

-- accept_invite: single use, but pressing the button twice does not fail.
reset role;
select pg_temp.act_as('b0000000-0000-0000-0000-00000000000b');
select is(public.accept_invite(current_setting('test.code')), current_setting('test.gid')::uuid,
  'B joins and gets the group id');
select is((select count(*) from public.group_members where group_id = current_setting('test.gid')::uuid), 2::bigint,
  'the group now has two members');
select is(public.accept_invite(current_setting('test.code')), current_setting('test.gid')::uuid,
  'a second click by B returns the same group');
select is((select count(*) from public.group_members where group_id = current_setting('test.gid')::uuid), 2::bigint,
  'a second click does not add a membership');
reset role;

-- Every way an invite can be unusable gives the same error.
insert into public.group_invites (group_id, code_hash, expires_at, revoked_at, max_uses, uses, created_by)
select current_setting('test.gid')::uuid, encode(extensions.digest(c, 'sha256'), 'hex'),
       case when c = 'expiredcode' then now() - interval '1 day' else now() + interval '1 day' end,
       case when c = 'revokedcode' then now() else null end,
       1, case when c = 'usedcode' then 1 else 0 end,
       'a0000000-0000-0000-0000-00000000000a'
from unnest(array['expiredcode', 'revokedcode', 'usedcode']) as c;
select pg_temp.act_as('c0000000-0000-0000-0000-00000000000c');
select throws_ok(format($$select public.accept_invite(%L)$$, current_setting('test.code')), 'P0002', 'invalid invite',
  'an invite already used by B cannot be used by C');
select throws_ok($$select public.accept_invite('nosuchcode')$$, 'P0002', 'invalid invite', 'an unknown code is invalid');
select throws_ok($$select public.accept_invite('expiredcode')$$, 'P0002', 'invalid invite', 'an expired code is invalid');
select throws_ok($$select public.accept_invite('revokedcode')$$, 'P0002', 'invalid invite', 'a revoked code is invalid');
select throws_ok($$select public.accept_invite('usedcode')$$, 'P0002', 'invalid invite', 'an exhausted code is invalid');
select throws_ok($$select * from public.preview_invite('expiredcode')$$, 'P0002', 'invalid invite',
  'the preview of an expired code is invalid');
reset role;

-- The group is capped at 30 members.
insert into auth.users (id, email)
  select ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'm' || i || '@pgtap.test' from generate_series(1, 28) i;
insert into public.profiles (id, display_name)
  select ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 'Membro ' || i from generate_series(1, 28) i;
insert into public.group_members (group_id, user_id)
  select current_setting('test.gid')::uuid, ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid from generate_series(1, 28) i;
insert into public.group_invites (group_id, code_hash, expires_at, max_uses, created_by)
  values (current_setting('test.gid')::uuid, encode(extensions.digest('fullcode', 'sha256'), 'hex'),
          now() + interval '1 day', 5, 'a0000000-0000-0000-0000-00000000000a');
select pg_temp.act_as('c0000000-0000-0000-0000-00000000000c');
select throws_ok($$select public.accept_invite('fullcode')$$, 'P0001', 'group is full', 'the 31st member is rejected');
reset role;

-- At most 10 active invites per group, and sane settings.
select pg_temp.act_as('d0000000-0000-0000-0000-00000000000d');
select set_config('test.gid2', public.create_group('Altro reparto')::text, true);
select lives_ok($$select public.create_invite(current_setting('test.gid2')::uuid) from generate_series(1, 10)$$,
  'ten active invites are allowed');
select throws_ok($$select public.create_invite(current_setting('test.gid2')::uuid)$$, 'P0001', 'too many active invites',
  'the eleventh active invite is rejected');
select throws_ok($$select public.create_invite(current_setting('test.gid2')::uuid, 1, 0)$$, '22023', 'invalid invite settings',
  'an invite that lasts zero days is rejected');
reset role;

-- Anonymous callers cannot run any of them.
select pg_temp.act_as_anon();
select throws_ok($$select public.create_group('x')$$, '42501', null, 'anon cannot create a group');
select throws_ok($$select public.accept_invite('fullcode')$$, '42501', null, 'anon cannot accept an invite');
reset role;

select * from finish();
rollback;
