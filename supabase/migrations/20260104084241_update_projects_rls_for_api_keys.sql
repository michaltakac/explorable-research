-- Update RLS policies on projects table to support API key authentication
-- Uses get_current_user_id() which checks both auth.uid() and API key context

-- Add new policies that use get_current_user_id() for API key support
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  TO authenticated, anon
  USING (get_current_user_id() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated, anon
  USING (get_current_user_id() = user_id)
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  TO authenticated, anon
  USING (get_current_user_id() = user_id);

