/**
 * CloudFlare Worker: Subdomain Router for Explorable Research
 *
 * Routes requests from {slug}.explorableresearch.com to R2 bucket
 * Looks up project by subdomain_slug in Supabase, serves static files from R2
 */

export interface Env {
  BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string; // Format: sb_publishable_...
}

// Cache for slug -> project_id mapping (in-memory, per isolate)
const slugCache = new Map<string, { projectId: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getContentType(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

async function lookupProjectBySlug(slug: string, env: Env): Promise<string | null> {
  // Check cache first
  const cached = slugCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.projectId;
  }

  // Query Supabase for the project using publishable key
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/projects?subdomain_slug=eq.${encodeURIComponent(slug)}&select=id`,
    {
      headers: {
        'apikey': env.SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );

  if (!response.ok) {
    console.error(`Supabase lookup failed: ${response.status}`);
    return null;
  }

  const data = await response.json() as Array<{ id: string }>;

  if (data.length === 0) {
    return null;
  }

  const projectId = data[0].id;

  // Cache the result
  slugCache.set(slug, {
    projectId,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return projectId;
}

async function serveFromR2(
  projectId: string,
  path: string,
  env: Env
): Promise<Response> {
  // Construct R2 key: projects/{project_id}/{path}
  const r2Key = `projects/${projectId}/${path}`;

  const object = await env.BUCKET.get(r2Key);

  if (!object) {
    return new Response('File not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', getContentType(path));
  headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  headers.set('Access-Control-Allow-Origin', '*');

  // Add ETag for caching
  if (object.etag) {
    headers.set('ETag', object.etag);
  }

  return new Response(object.body, { headers });
}

function extractSlugFromHost(host: string): string | null {
  // Expected format: {slug}.explorableresearch.com
  // Also handle: {slug}.explorable.localhost:8787 for local dev

  const parts = host.split('.');

  // Need at least: slug.domain.tld or slug.localhost:port
  if (parts.length < 2) {
    return null;
  }

  const slug = parts[0];

  // Don't treat 'www' or 'app' as slugs
  if (['www', 'app', 'api'].includes(slug)) {
    return null;
  }

  return slug;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = request.headers.get('host') || '';

    // Extract subdomain slug
    const slug = extractSlugFromHost(host);

    if (!slug) {
      // No valid slug - this might be the main domain
      return new Response('Explorable Research - Invalid subdomain', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Look up project by slug
    const projectId = await lookupProjectBySlug(slug, env);

    if (!projectId) {
      return new Response(`Project not found for: ${slug}`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Determine which file to serve
    let path = url.pathname.slice(1); // Remove leading slash

    // Default to index.html for root or directory paths
    if (!path || path.endsWith('/')) {
      path = path + 'index.html';
    }

    // Serve from R2
    return serveFromR2(projectId, path, env);
  },
};
