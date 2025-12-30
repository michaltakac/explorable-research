# Supabase Setup Instructions

This document outlines how to set up Supabase for the Explorable Research application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Environment Variables

Add the following environment variables to your `.env.local` file and Vercel project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ytezflduoydgrfxrkvpd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_ggy15xgHC4sVbE1vGEmeyw_l1XKQHDO
```

## Database Setup

### 1. Run the Schema SQL

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (left sidebar)
3. Create a new query
4. Copy the contents of `supabase/schema.sql`
5. Paste into the SQL Editor and run the query

This will create:
- `teams` table - Organization/team management
- `users_teams` table - User-team relationships
- `projects` table - User-generated explorable projects
- Row Level Security (RLS) policies for all tables
- Automatic triggers for timestamps
- Helper function to create default teams for new users

### 2. Enable Authentication Providers

#### Email/Password Authentication

1. Go to Authentication > Providers in your Supabase dashboard
2. Email provider is enabled by default
3. Configure email templates if desired (Settings > Auth > Email Templates)

#### Google OAuth

1. Go to Authentication > Providers
2. Enable the Google provider
3. Add your Google OAuth credentials:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Add authorized redirect URI: `https://ytezflduoydgrfxrkvpd.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
4. Save configuration

#### GitHub OAuth

1. Go to Authentication > Providers
2. Enable the GitHub provider
3. Add your GitHub OAuth credentials:
   - Create OAuth App in [GitHub Developer Settings](https://github.com/settings/developers)
   - Add authorization callback URL: `https://ytezflduoydgrfxrkvpd.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
4. Save configuration

### 3. Configure Auth Settings

1. Go to Authentication > Settings
2. **Site URL**: Set to your production domain (e.g., `https://your-domain.com`)
3. **Redirect URLs**: Add both:
   - `http://localhost:3000/**` (for local development)
   - `https://your-domain.com/**` (for production)

### 4. Email Confirmation (Optional)

By default, Supabase requires email confirmation for new signups.

To disable email confirmation (for development):
1. Go to Authentication > Settings
2. Disable "Enable email confirmations"

For production, keep email confirmations enabled for security.

## Database Schema Overview

### Tables

#### `teams`
Stores team/organization information. Each user gets a default team on signup.

#### `users_teams`
Junction table linking users to teams. Supports multiple team memberships with a default team flag.

#### `projects`
Stores user-generated explorable research projects with:
- Fragment metadata (title, description, code)
- Execution details (sandbox ID, URLs)
- Publishing status
- AI model information
- Automatic timestamps

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

**Teams:**
- Users can view teams they belong to
- Users can update teams they belong to

**Users_Teams:**
- Users can view their own team memberships
- Users can insert their own team memberships

**Projects:**
- Users can view ONLY their own projects
- Users can insert ONLY their own projects
- Users can update ONLY their own projects
- Users can delete ONLY their own projects

**Security Note:** RLS policies ensure users can never access another user's data, even through direct database queries or API calls.

## Testing the Setup

### Test Authentication

1. Start your development server: `npm run dev`
2. Click "Sign in" in the navbar
3. Test each authentication method:
   - Email/Password signup and login
   - Google OAuth
   - GitHub OAuth

### Test Projects

1. Generate an explorable research project
2. The project should automatically save to your database
3. Navigate to "My Projects" from the user dropdown menu
4. Verify you can see your project
5. Click on a project to view details
6. Test that you cannot access projects from other users

## Troubleshooting

### Authentication Issues

**Problem:** "Invalid login credentials" error
- **Solution:** Check that the user exists and email is confirmed (if enabled)

**Problem:** OAuth redirect fails
- **Solution:** Verify redirect URIs are correctly configured in both Supabase and OAuth provider

### Database Issues

**Problem:** "Permission denied" when accessing projects
- **Solution:** Ensure RLS policies are properly set up by re-running the schema.sql

**Problem:** User can't see their own projects
- **Solution:** Check that the user is authenticated and the session is valid

### Environment Variable Issues

**Problem:** "Supabase not configured" warning
- **Solution:** Verify environment variables are set correctly in `.env.local`
- **Solution:** Restart the development server after adding environment variables

## Security Best Practices

1. **Never commit `.env.local`** - It's in .gitignore by default
2. **Use RLS policies** - Always rely on Row Level Security, not client-side checks
3. **Validate on server** - All API routes use `requireAuth()` for authentication checks
4. **Secure secrets** - Store sensitive keys in Vercel environment variables, not in code
5. **Email validation** - Consider enabling email confirmation for production
6. **Rate limiting** - The app includes rate limiting for API endpoints

## Production Deployment

### Vercel Setup

1. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

2. Deploy to Vercel

3. Update Supabase Auth Settings:
   - Set Site URL to your Vercel domain
   - Add Vercel domain to Redirect URLs

### Database Backups

Enable automatic backups in Supabase:
1. Go to Database > Backups
2. Configure backup schedule
3. Enable Point-in-Time Recovery (PITR) for production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
