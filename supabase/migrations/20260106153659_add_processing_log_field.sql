-- Add processing_log field to track async pipeline progress
-- Also add status-related fields for the async processing workflow

-- Add status field for async pipeline tracking
alter table public.projects
add column if not exists status text not null default 'ready';

-- Add error_message column for failed projects
alter table public.projects
add column if not exists error_message text;

-- Add updated_at column for tracking last update
alter table public.projects
add column if not exists updated_at timestamp with time zone not null default now();

-- Add status_message for human-readable status updates
alter table public.projects
add column if not exists status_message text;

-- Add processing_log for detailed step-by-step logging
alter table public.projects
add column if not exists processing_log jsonb default '[]'::jsonb;

-- Add timestamps for tracking processing duration
alter table public.projects
add column if not exists started_at timestamp with time zone;

alter table public.projects
add column if not exists completed_at timestamp with time zone;

-- Create index on status for efficient filtering
create index if not exists projects_status_idx on public.projects (status);
