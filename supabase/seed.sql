-- Seed File: Create 100 test users with API keys for development/testing
-- WARNING: This file is for DEVELOPMENT ONLY. It will NOT be applied to production.
--
-- Usage:
--   supabase db reset    # Resets the database and runs migrations + this seed file
--   -- OR manually run this file on a dev branch --
--
-- This creates 100 test users with:
-- - Mix of real names and funny fake names (~10% funny)
-- - Fake emails and usernames
-- - Some usernames derived from names, most randomly created (internet-style)
-- - Each user gets an API key for automation testing

-- Create a function to seed test users with API keys
CREATE OR REPLACE FUNCTION keyhippo_impersonation.seed_test_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  username text,
  api_key text,
  api_key_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = keyhippo, keyhippo_rbac, public
AS $$
DECLARE
  user_data RECORD;
  new_user_id uuid;
  key_result RECORD;
  i integer;

  -- Arrays for generating realistic names
  first_names text[] := ARRAY[
    -- Regular names (90 users)
    'James', 'Michael', 'David', 'Robert', 'William',
    'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda',
    'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joseph',
    'Jennifer', 'Elizabeth', 'Michelle', 'Stephanie', 'Nicole',
    'Ryan', 'Brandon', 'Justin', 'Kevin', 'Brian',
    'Megan', 'Rachel', 'Lauren', 'Samantha', 'Brittany',
    'Tyler', 'Joshua', 'Eric', 'Steven', 'Aaron',
    'Heather', 'Amber', 'Danielle', 'Tiffany', 'Christina',
    'Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan',
    'Cameron', 'Dylan', 'Hunter', 'Cody', 'Dakota',
    'Marcus', 'Derek', 'Trevor', 'Kyle', 'Sean',
    'Kayla', 'Courtney', 'Vanessa', 'Natalie', 'Rebecca',
    'Nathan', 'Patrick', 'Scott', 'Jeremy', 'Travis',
    'Victoria', 'Hannah', 'Jasmine', 'Sierra', 'Brianna',
    'Ethan', 'Noah', 'Aiden', 'Lucas', 'Mason',
    'Olivia', 'Sophia', 'Emma', 'Ava', 'Isabella',
    'Liam', 'Logan', 'Jake', 'Owen', 'Caleb',
    'Chloe', 'Lily', 'Grace', 'Zoe', 'Leah',
    -- Funny names (10 users)
    'Streetlamp', 'Abcde', 'Hashtag', 'Dovahkiin', 'Jedi',
    'Batman', 'Megatron', 'Espn', 'Google', 'Shrek'
  ];

  last_names text[] := ARRAY[
    -- Regular last names (90)
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris',
    'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright',
    'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall',
    'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Chen', 'Kim', 'Patel', 'Singh', 'Wang',
    'Murphy', 'Collins', 'Stewart', 'Morris', 'Cook',
    'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed',
    'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard',
    'Ward', 'Cox', 'Diaz', 'Richardson', 'Wood',
    'Watson', 'Brooks', 'Bennett', 'Gray', 'James',
    'Reyes', 'Cruz', 'Hughes', 'Price', 'Myers',
    'Long', 'Foster', 'Sanders', 'Ross', 'Morales',
    -- Funny last names (10)
    'LeMoose', 'McLovin', 'Thunderfist', 'Stardust', 'Moonbeam',
    'Wafflestein', 'Pizzarelli', 'Noodleman', 'Turtlebottom', 'Sparklepants'
  ];

  -- Internet-style usernames (these look like real Twitter/X handles)
  internet_usernames text[] := ARRAY[
    'xX_DarkKnight_Xx', 'n00bmaster69', 'codingwizard', 'techbro_42',
    'pixel_pusher', 'bug_hunter_', 'caffeinated_coder', 'sudo_master',
    'git_gud_', 'stack_overflow_refugee', 'npm_install_coffee',
    'midnight_hacker', '404_brain_not_found', 'semicolon_survivor',
    'the_real_dev', 'just_a_human', 'totally_not_a_bot', 'verified_loser',
    'professional_lurker', 'reply_guy', 'main_character', 'ratio_king',
    'based_and_redpilled', 'touch_grass', 'chronically_online',
    'unhinged_and_free', 'certified_menace', 'chaos_goblin',
    'sleep_is_overrated', '3am_thoughts', 'doom_scroller',
    'crypto_bro_reformed', 'nft_skeptic', 'web3_survivor',
    'ai_will_replace_me', 'prompt_engineer', 'llm_whisperer',
    'vim_or_die', 'emacs_gang', 'nano_normie', 'vscode_simp',
    'arch_btw', 'ubuntu_user', 'windows_defender', 'macos_supremacist',
    'dark_mode_only', 'light_mode_psycho', 'tabs_not_spaces',
    'spaces_not_tabs', 'no_tests_needed', 'yolo_deployer',
    'friday_deploy_enjoyer', 'hotfix_hero', 'merge_conflict_survivor',
    'rebase_rebel', 'squash_and_merge', 'force_push_enthusiast',
    'deprecated_dreams', 'legacy_code_maintainer', 'tech_debt_collector',
    'refactor_addict', 'clean_code_cultist', 'pragmatic_programmer',
    'keyboard_warrior', 'monitor_hoarder', 'mechanical_click_clack',
    'standing_desk_user', 'ergonomic_everything', 'carpal_tunnel_speedrun',
    'coffee_to_code', 'energy_drink_dependent', 'tea_superiority',
    'imposter_syndrome', 'dunning_kruger_peak', 'tutorial_hell_escapee',
    'bootcamp_grad', 'self_taught_chaos', 'cs_degree_regret',
    'interview_grinder', 'leetcode_victim', 'whiteboard_trauma',
    'remote_work_advocate', 'office_is_lava', 'zoom_fatigue',
    'slack_overload', 'email_bankruptcy', 'meeting_that_couldve_been',
    'agile_skeptic', 'scrum_master_hater', 'waterfall_nostalgia',
    'burnout_speedrun', 'quiet_quitting', 'loud_working',
    'open_source_freeloader', 'github_green_squares', 'commit_streak'
  ];

  current_first text;
  current_last text;
  current_display_name text;
  current_username text;
  current_email text;
  username_type integer;
  random_suffix text;
BEGIN
  FOR i IN 1..100 LOOP
    -- Pick names (last 10 are funny combinations)
    IF i > 90 THEN
      -- Funny names (10%)
      current_first := first_names[90 + ((i - 91) % 10) + 1];
      current_last := last_names[90 + ((i - 91) % 10) + 1];
    ELSE
      -- Regular names (90%)
      current_first := first_names[((i - 1) % 90) + 1];
      current_last := last_names[((i - 1) % 90) + 1];
    END IF;

    current_display_name := current_first || ' ' || current_last;

    -- Generate username (various styles to look realistic)
    username_type := (i % 7);
    random_suffix := substr(md5(random()::text), 1, 4);

    CASE username_type
      WHEN 0 THEN
        -- Internet-style username from the list
        current_username := internet_usernames[((i - 1) % array_length(internet_usernames, 1)) + 1];
      WHEN 1 THEN
        -- firstname_lastname pattern
        current_username := lower(current_first) || '_' || lower(current_last);
      WHEN 2 THEN
        -- firstnamelastname + numbers
        current_username := lower(current_first) || lower(current_last) || (1990 + (i % 35))::text;
      WHEN 3 THEN
        -- first initial + lastname
        current_username := lower(substr(current_first, 1, 1)) || lower(current_last) || random_suffix;
      WHEN 4 THEN
        -- firstname + random numbers
        current_username := lower(current_first) || '_' || (100 + i)::text;
      WHEN 5 THEN
        -- the_real_firstname pattern
        current_username := 'the_real_' || lower(current_first);
      ELSE
        -- firstname.lastname
        current_username := lower(current_first) || '.' || lower(current_last);
    END CASE;

    -- Generate email (various domain styles)
    CASE (i % 5)
      WHEN 0 THEN
        current_email := current_username || '@gmail.com';
      WHEN 1 THEN
        current_email := current_username || '@outlook.com';
      WHEN 2 THEN
        current_email := current_username || '@yahoo.com';
      WHEN 3 THEN
        current_email := current_username || '@protonmail.com';
      ELSE
        current_email := current_username || '@icloud.com';
    END CASE;

    -- Ensure uniqueness by appending index if needed
    current_email := lower(replace(current_email, ' ', ''));
    current_username := lower(replace(current_username, ' ', '_')) || '_' || i::text;

    -- Create user in auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      aud,
      role
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000'::uuid,
      current_email,
      crypt('TestPassword123!', gen_salt('bf')),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'display_name', current_display_name,
        'username', current_username,
        'full_name', current_display_name
      ),
      false,
      now() - (random() * interval '365 days'),
      now(),
      null,
      null,
      '',
      null,
      '',
      null,
      '',
      '',
      null,
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO new_user_id;

    -- Create identity for the user (required for Supabase auth)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object(
        'sub', new_user_id::text,
        'email', current_email,
        'email_verified', true
      ),
      'email',
      new_user_id::text,
      now(),
      now() - (random() * interval '365 days'),
      now()
    );

    -- Create API key for this user
    -- We need to temporarily set the auth context to this user
    PERFORM set_config('request.jwt.claim.sub', new_user_id::text, true);
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', new_user_id::text)::text, true);

    -- Generate API key using KeyHippo
    SELECT * INTO key_result FROM keyhippo.create_api_key(
      'Automation API Key for ' || current_display_name,
      NULL  -- default scope
    );

    -- Return the generated data
    user_id := new_user_id;
    email := current_email;
    display_name := current_display_name;
    username := current_username;
    api_key := key_result.api_key;
    api_key_id := key_result.api_key_id;

    RETURN NEXT;
  END LOOP;

  -- Reset the auth context
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claims', '', true);

  RETURN;
END;
$$;

-- Create a table to store the seeded test user data (including API keys)
-- This allows us to reference the test users and their API keys later
CREATE TABLE IF NOT EXISTS public.seeded_test_users (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  username text NOT NULL,
  api_key text NOT NULL,
  api_key_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add RLS to protect the test users table (only service role can access)
ALTER TABLE public.seeded_test_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access this table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seeded_test_users' AND policyname = 'Service role full access to seeded_test_users'
  ) THEN
    CREATE POLICY "Service role full access to seeded_test_users"
      ON public.seeded_test_users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Comment explaining the table
COMMENT ON TABLE public.seeded_test_users IS
  'Stores test user data including API keys for development/testing automation.
   WARNING: This table contains API keys and should only be used in development environments.';

-- Execute the seeding function and store results
INSERT INTO public.seeded_test_users (user_id, email, display_name, username, api_key, api_key_id)
SELECT user_id, email, display_name, username, api_key, api_key_id
FROM keyhippo_impersonation.seed_test_users();

-- Output a summary
DO $$
DECLARE
  user_count integer;
  key_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.seeded_test_users;
  SELECT COUNT(*) INTO key_count FROM keyhippo.api_key_metadata
    WHERE description LIKE 'Automation API Key for%';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test User Seeding Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users created: %', user_count;
  RAISE NOTICE 'Total API keys created: %', key_count;
  RAISE NOTICE '';
  RAISE NOTICE 'To view all test users and their API keys:';
  RAISE NOTICE 'SELECT * FROM public.seeded_test_users;';
  RAISE NOTICE '';
  RAISE NOTICE 'Default password for all users: TestPassword123!';
  RAISE NOTICE '========================================';
END $$;

-- Create a helper view for easy access to test user info (without full API keys)
CREATE OR REPLACE VIEW public.test_users_summary AS
SELECT
  s.id,
  s.user_id,
  s.email,
  s.display_name,
  s.username,
  LEFT(s.api_key, 10) || '...' AS api_key_preview,
  s.api_key_id,
  s.created_at
FROM public.seeded_test_users s
ORDER BY s.id;

COMMENT ON VIEW public.test_users_summary IS
  'Summary view of test users with truncated API keys for safe viewing.
   Use seeded_test_users table for full API keys.';
