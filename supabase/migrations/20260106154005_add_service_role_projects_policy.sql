-- Add service role full access policy for projects table
-- This allows edge functions to update project status during async processing

create policy "Service role has full access to projects"
  on public.projects
  for all
  to service_role
  using (true)
  with check (true);
