-- Explorable Research Database Schema
-- This file contains the complete database schema for the application
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TEAMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- USERS_TEAMS JUNCTION TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.users_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- ================================================
-- PROJECTS TABLE
-- Stores user fragments/explorable sessions
-- ================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,

  -- Project metadata
  title TEXT NOT NULL,
  description TEXT,

  -- Fragment data
  template TEXT NOT NULL, -- e.g., 'nextjs-developer', 'python-developer'
  code TEXT NOT NULL,
  file_path TEXT,
  port INTEGER,
  additional_dependencies JSONB DEFAULT '[]'::jsonb,

  -- AI model used
  model_provider TEXT, -- e.g., 'openai', 'anthropic'
  model_name TEXT,     -- e.g., 'gpt-4', 'claude-3-opus'

  -- Execution metadata
  sandbox_id TEXT,
  sandbox_url TEXT,
  execution_status TEXT DEFAULT 'draft', -- 'draft', 'running', 'completed', 'failed'

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_url TEXT,
  short_url_id TEXT, -- nanoid for /s/:id URLs

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Indexes for performance
  CONSTRAINT projects_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_short_url_id ON public.projects(short_url_id) WHERE short_url_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_teams_user_id ON public.users_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_users_teams_team_id ON public.users_teams(team_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ================================================
-- TEAMS POLICIES
-- ================================================

-- Users can view teams they belong to
CREATE POLICY "Users can view their teams"
  ON public.teams
  FOR SELECT
  USING (
    id IN (
      SELECT team_id
      FROM public.users_teams
      WHERE user_id = auth.uid()
    )
  );

-- Users can update teams they belong to (if needed)
CREATE POLICY "Users can update their teams"
  ON public.teams
  FOR UPDATE
  USING (
    id IN (
      SELECT team_id
      FROM public.users_teams
      WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- USERS_TEAMS POLICIES
-- ================================================

-- Users can view their own team memberships
CREATE POLICY "Users can view their team memberships"
  ON public.users_teams
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own team memberships (for self-service team creation)
CREATE POLICY "Users can insert their team memberships"
  ON public.users_teams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ================================================
-- PROJECTS POLICIES
-- ================================================

-- Users can view ONLY their own projects
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert ONLY their own projects
CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update ONLY their own projects
CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete ONLY their own projects
CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (user_id = auth.uid());

-- ================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- HELPER FUNCTION: Create default team for new users
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Create a default team for the user
  INSERT INTO public.teams (name, email, tier)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'free'
  )
  RETURNING id INTO new_team_id;

  -- Link user to their default team
  INSERT INTO public.users_teams (user_id, team_id, is_default)
  VALUES (NEW.id, new_team_id, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default team when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- GRANTS
-- ================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT, INSERT ON public.users_teams TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================================
-- COMMENTS (Documentation)
-- ================================================

COMMENT ON TABLE public.teams IS 'Teams that users belong to. Each user has at least one default team.';
COMMENT ON TABLE public.users_teams IS 'Junction table linking users to teams. Users can belong to multiple teams.';
COMMENT ON TABLE public.projects IS 'User-generated explorable research fragments/sessions. Each project belongs to exactly one user and optionally one team.';
COMMENT ON COLUMN public.projects.user_id IS 'Owner of the project. Required field.';
COMMENT ON COLUMN public.projects.team_id IS 'Optional team association. Allows team-level organization.';
COMMENT ON COLUMN public.projects.template IS 'E2B sandbox template used (e.g., nextjs-developer, python-developer)';
COMMENT ON COLUMN public.projects.code IS 'The generated code/fragment content';
COMMENT ON COLUMN public.projects.sandbox_id IS 'E2B sandbox identifier for execution';
COMMENT ON COLUMN public.projects.execution_status IS 'Current status: draft, running, completed, or failed';
COMMENT ON COLUMN public.projects.is_published IS 'Whether the project is publicly accessible via short URL';
COMMENT ON COLUMN public.projects.short_url_id IS 'Nanoid for /s/:id short URL redirects';
