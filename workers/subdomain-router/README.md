# Explorable Research - Subdomain Router Worker

CloudFlare Worker that routes subdomain requests to static files stored in R2.

## How It Works

```
{slug}.explorableresearch.com
         │
         ▼
   CloudFlare Worker
         │
         ├─► Lookup slug in Supabase → Get project_id
         │
         ▼
   R2 Bucket: projects/{project_id}/index.html
```

## Setup Instructions

### 1. Create R2 Bucket

1. Go to CloudFlare Dashboard → **R2 Object Storage**
2. Click **Create bucket**
3. Name: `explorable-websites`
4. Note your **Account ID** from the dashboard

### 2. Configure wrangler.toml

Edit `wrangler.toml` and add your account ID:

```toml
account_id = "your-account-id-here"
```

### 3. Set Secrets

```bash
cd workers/subdomain-router

# Set Supabase publishable key (for looking up projects)
wrangler secret put SUPABASE_PUBLISHABLE_KEY
# Paste your Supabase publishable key (format: sb_publishable_...) when prompted
```

Update `SUPABASE_URL` in `wrangler.toml` with your actual project URL.

> **Note:** Use the new publishable key format (`sb_publishable_...`) instead of legacy anon keys. Find it in Supabase Dashboard → Project Settings → API.

### 4. Configure DNS (CloudFlare)

1. Go to your domain's DNS settings in CloudFlare
2. Add a wildcard CNAME record:
   - **Type:** CNAME
   - **Name:** `*` (or `*.explorableresearch.com`)
   - **Target:** Your Worker route (or use proxied A record)
   - **Proxy status:** Proxied (orange cloud)

### 5. Configure Worker Route

In `wrangler.toml`, uncomment and configure the routes:

```toml
routes = [
  { pattern = "*.explorableresearch.com/*", zone_name = "explorableresearch.com" }
]
```

### 6. Deploy

```bash
npm install
npm run deploy
```

## Local Development

```bash
npm run dev
```

The worker runs at `http://localhost:8787`. For local testing with subdomains, you can:

1. Edit `/etc/hosts` to add: `127.0.0.1 test-slug.localhost`
2. Access `http://test-slug.localhost:8787`

## R2 Bucket Structure

```
explorable-websites/
  └── projects/
      └── {project-uuid}/
          ├── index.html
          ├── styles.css
          └── main.js
```

## Uploading Files to R2

### Via Wrangler CLI

```bash
# Upload a single file
wrangler r2 object put explorable-websites/projects/{project-id}/index.html --file ./index.html

# Upload directory (use a script)
for file in index.html styles.css main.js; do
  wrangler r2 object put explorable-websites/projects/{project-id}/$file --file ./$file
done
```

### Via CloudFlare API (for scripts)

```typescript
// Using @aws-sdk/client-s3 (R2 is S3-compatible)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

await client.send(new PutObjectCommand({
  Bucket: "explorable-websites",
  Key: `projects/${projectId}/index.html`,
  Body: htmlContent,
  ContentType: "text/html",
}));
```

## Environment Variables

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL | wrangler.toml [vars] |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) | `wrangler secret put` |

## Caching

- Slug → project_id mappings are cached in-memory for 5 minutes
- Static files are served with `Cache-Control: public, max-age=3600` (1 hour)
- CloudFlare's edge cache will also cache responses

## Troubleshooting

### "Project not found" error
- Verify the `subdomain_slug` column exists and is set in the projects table
- Check that the project exists in Supabase

### Files not loading
- Verify files are uploaded to the correct R2 path
- Check R2 bucket name matches wrangler.toml
- Ensure BUCKET binding is correct

### CORS issues
- The worker sets `Access-Control-Allow-Origin: *`
- If you need stricter CORS, modify the headers in `src/index.ts`
