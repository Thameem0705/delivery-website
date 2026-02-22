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

-- ══════════════════════════════════════════════
-- PROFILE PHOTO UPLOAD SETUP (run separately)
-- ══════════════════════════════════════════════

-- 1. Add avatar_url column to profiles
alter table public.profiles
  add column if not exists avatar_url text;

-- 2. Create public storage bucket for profile photos
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- 3. Storage policies
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ══════════════════════════════════════════════
-- USER MANAGEMENT & PERMISSIONS (run separately)
-- ══════════════════════════════════════════════

-- 1. Add remarks column so admin can add notes per driver
alter table public.profiles
  add column if not exists remarks text;

-- 2. Permission requests table
create table if not exists public.permission_requests (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  user_name   text,
  type        text not null,
  message     text not null,
  status      text default 'pending' check (status in ('pending', 'approved', 'denied')),
  admin_reply text,
  created_at  timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.permission_requests enable row level security;

-- Delivery user can insert and view their own requests
create policy "Users can insert own permission requests"
  on permission_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can view own permission requests"
  on permission_requests for select
  using (
    auth.uid() = user_id
    or auth.uid() in (select id from profiles where role = 'admin')
  );

-- Admin can update (approve/deny) requests
create policy "Admins can update permission requests"
  on permission_requests for update
  using (
    auth.uid() in (select id from profiles where role = 'admin')
  );

-- ══════════════════════════════════════════════
-- FORGOT PASSWORD / RESET BY PHONE NUMBER
-- ══════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor

create or replace function public.reset_password_by_phone(
  p_phone text,
  p_new_password text
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from public.profiles
  where phone_number = p_phone
  limit 1;

  if v_user_id is null then
    return json_build_object('success', false, 'message', 'Mobile number not registered');
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  where id = v_user_id;

  return json_build_object('success', true, 'message', 'Password updated successfully');
end;
$$;

grant execute on function public.reset_password_by_phone(text, text) to anon, authenticated;
