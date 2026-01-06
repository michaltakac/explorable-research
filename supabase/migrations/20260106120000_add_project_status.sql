-- Add status field to projects table for async pipeline tracking
-- Status values:
--   'pending' - Project created, waiting to start processing
--   'processing_pdf' - Processing PDF/ArXiv paper
--   'generating' - Generating fragment with AI
--   'creating_sandbox' - Creating sandbox environment
--   'ready' - Complete with preview URL
--   'failed' - Processing failed

alter table public.projects
add column if not exists status text not null default 'ready';

-- Add error_message column for failed projects
alter table public.projects
add column if not exists error_message text;

-- Add updated_at column for tracking last update
alter table public.projects
add column if not exists updated_at timestamp with time zone not null default now();

-- Create index on status for efficient filtering
create index if not exists projects_status_idx on public.projects (status);

-- Set existing projects to 'ready' status (they were created synchronously)
update public.projects set status = 'ready' where status is null;
