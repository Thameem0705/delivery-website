-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- Create profiles table (User Profiles)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  username text unique,
  role text default 'delivery' check (role in ('admin', 'delivery')),
  full_name text,
  phone_number text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- NOTE: If the profiles table already exists, run these ALTER TABLE commands instead:
-- alter table public.profiles add column if not exists phone_number text;
-- alter table public.profiles add column if not exists address text;

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  location_address text,
  latitude float,
  longitude float,
  google_maps_url text,
  status text default 'pending' check (status in ('pending', 'completed')),
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for tasks
alter table public.tasks enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policies for tasks
-- Admin can do everything
create policy "Admins can do everything on tasks"
  on tasks
  for all
  using ( 
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- Delivery users can view assigned tasks
create policy "Delivery users can view assigned tasks"
  on tasks
  for select
  using ( 
    auth.uid() = assigned_to
  );

-- Delivery users can update status of assigned tasks
create policy "Delivery users can update assigned tasks"
  on tasks
  for update
  using ( 
    auth.uid() = assigned_to
  )
  with check (
    auth.uid() = assigned_to
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, role, full_name, phone_number, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'real_email', new.email),
    new.raw_user_meta_data->>'username',
    'delivery',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'address'
  );
  return new;
end;
$$;

-- Trigger to call the function on new user signup
-- Note: This requires relevant permissions. Usually works in Dashboard SQL Editor.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
