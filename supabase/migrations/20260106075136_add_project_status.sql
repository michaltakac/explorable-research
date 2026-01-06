-- Add status field to projects table for async project creation pipeline
-- Status values represent different stages in the project creation process

-- Add status column with default 'created'
alter table public.projects
add column if not exists status text not null default 'created';

-- Add error_message column to store failure reasons
alter table public.projects
add column if not exists error_message text;

-- Add updated_at column to track status changes
alter table public.projects
add column if not exists updated_at timestamp with time zone not null default now();

-- Create index on status for efficient querying
create index if not exists projects_status_idx on public.projects (status);

-- Add a check constraint for valid status values
alter table public.projects
add constraint projects_status_check
check (status in (
  'created',
  'generating_code',
  'creating_sandbox',
  'installing_dependencies',
  'executing_code',
  'ready',
  'failed'
));

-- Create a function to automatically update updated_at timestamp
create or replace function public.update_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at on any row update
drop trigger if exists projects_updated_at_trigger on public.projects;
create trigger projects_updated_at_trigger
  before update on public.projects
  for each row
  execute function public.update_projects_updated_at();

-- Add comment explaining status values
comment on column public.projects.status is 'Project creation pipeline status: created, generating_code, creating_sandbox, installing_dependencies, executing_code, ready, failed';
comment on column public.projects.error_message is 'Error message when status is failed';
comment on column public.projects.updated_at is 'Timestamp of last status update';
