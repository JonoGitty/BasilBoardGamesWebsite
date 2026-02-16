-- Profiles table: one row per authenticated user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_icon text not null default '🎲',
  accent_color text not null default '#7c6ff7',
  reduced_motion boolean not null default false,
  analytics_opt_out boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can only read their own profile
create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

-- Users can only update their own profile
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Users can only insert their own profile
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
