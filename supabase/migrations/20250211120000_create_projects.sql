create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  description text,
  fragment jsonb,
  result jsonb,
  messages jsonb,
  created_at timestamp with time zone not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

alter table public.projects enable row level security;

create policy "Users can view their projects"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
