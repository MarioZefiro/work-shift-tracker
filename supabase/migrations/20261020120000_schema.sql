-- Tables for accounts, groups and shifts. Access rules live in the next migration.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  time_zone text not null default 'Europe/Rome',
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  role text not null default 'member' check (role in ('manager', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
-- The primary key only indexes group_id first; policies and "my groups" look up by user.
create index group_members_user_id_idx on public.group_members (user_id);

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  max_uses int not null default 1 check (max_uses >= 1),
  uses int not null default 0 check (uses >= 0),
  revoked_at timestamptz,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index group_invites_group_id_idx on public.group_invites (group_id);

create table public.shift_types (
  group_id uuid not null references public.groups on delete cascade,
  code text not null check (code in ('M', 'P', 'N', 'R')),
  label text not null,
  start_time time not null,
  duration_minutes int not null check (duration_minutes > 0),
  primary key (group_id, code)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id uuid not null,
  code text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  unique (group_id, user_id, starts_at),
  -- A shift belongs to a member of the group; leaving the group removes the shifts.
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade,
  foreign key (group_id, code) references public.shift_types (group_id, code)
);
create index shifts_group_id_starts_at_idx on public.shifts (group_id, starts_at);
create index shifts_user_id_starts_at_idx on public.shifts (user_id, starts_at);
