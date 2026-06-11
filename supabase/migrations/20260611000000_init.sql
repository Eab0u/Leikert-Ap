-- Sentio MVP schema: profiles, friendships, checkins, journal_entries
-- All tables have Row Level Security enabled. No exceptions.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

alter table public.profiles enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Create the profile automatically on signup from the username passed in
-- auth metadata, so the client never races RLS during signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------
create table public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint no_self_friendship check (requester_id <> addressee_id)
);

-- one row per unordered pair, regardless of who asked first
create unique index friendships_unique_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Security-definer helper so checkins policies can consult friendships
-- without recursive RLS evaluation.
create function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = user_a and addressee_id = user_b)
        or (requester_id = user_b and addressee_id = user_a))
  );
$$;

create policy "friendships visible to the two users involved"
  on public.friendships for select
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

create policy "users can send friend requests"
  on public.friendships for insert
  to authenticated
  with check (requester_id = auth.uid() and status = 'pending');

create policy "only the addressee can accept"
  on public.friendships for update
  to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status = 'accepted');

create policy "either user can remove the friendship"
  on public.friendships for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- ---------------------------------------------------------------------------
-- checkins
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  rating int not null check (rating between 1 and 7),
  chips text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.checkins enable row level security;

create policy "owners have full access to their checkins"
  on public.checkins for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "accepted friends can read checkins"
  on public.checkins for select
  to authenticated
  using (public.are_friends(auth.uid(), user_id));

create index checkins_user_date_idx on public.checkins (user_id, date desc);

-- ---------------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.journal_entries enable row level security;

create policy "journal entries are owner-only, every operation"
  on public.journal_entries for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index journal_entries_user_date_idx on public.journal_entries (user_id, date desc);
