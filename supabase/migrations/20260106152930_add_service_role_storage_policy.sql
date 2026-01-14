-- Add service role full access policy for PDFs bucket
-- This allows edge functions and server-side code to manage PDF files

create policy "Service role has full access to PDFs"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'pdfs')
  with check (bucket_id = 'pdfs');
