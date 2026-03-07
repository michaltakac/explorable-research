# Bulk Explorable Website Generation System

## Overview

A system to automatically generate hundreds of interactive explorable research websites from ArXiv papers/PDFs, deploy them to CloudFlare R2, and associate them with seeded test users as example content.

**Goal:** Generate 1000-1500 explorable websites over several days, creating a library of examples that can serve as templates for other users.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BULK GENERATION SCRIPT                          │
│      (Node.js with Claude Agent SDK + Supabase service role)        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────────────┐
         ▼                         ▼                                 ▼
┌─────────────────┐    ┌───────────────────────────┐    ┌──────────────────┐
│   ArXiv / PDFs  │    │  Claude Code (subscription)│    │    Supabase      │
│   (Input)       │    │  via Claude Agent SDK     │    │  (Projects DB)   │
└─────────────────┘    └───────────────────────────┘    └──────────────────┘
                                   │
                                   ▼
                       ┌─────────────────────┐
                       │   CloudFlare R2     │
                       │  (Static hosting)   │
                       └─────────────────────┘
                                   │
                                   ▼
                       ┌─────────────────────────────────────┐
                       │  {slug}.explorableresearch.com      │
                       └─────────────────────────────────────┘
```

---

## Components

### 1. CloudFlare R2 Static Deployment

#### Storage Structure

```
r2-bucket/
  └── projects/
      └── {project_id}/
          ├── index.html
          ├── styles.css
          └── main.js
```

#### Subdomain Routing Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **CloudFlare Worker + R2** | Wildcard DNS `*.explorableresearch.com` → Worker that looks up slug in DB and serves from R2 | Full control, custom routing logic | More setup, need to manage Worker |
| **CloudFlare Pages** | Each project as a Pages deployment | Easy, built-in preview URLs | Requires git integration per project |
| **R2 Custom Domain** | Direct R2 bucket serving | Simplest setup | Limited routing flexibility |

**Recommended:** CloudFlare Worker + R2 for flexibility with custom domains.

#### Subdomain Strategy

- **Generated slugs:** `abc123xyz.explorableresearch.com` (random, collision-resistant)
- **Semantic slugs:** `attention-is-all-you-need.explorableresearch.com` (derived from paper title)
- **Custom domains:** User brings their own domain (future feature)

---

### 2. Database Schema Additions

New fields/tables needed:

```sql
-- Add to projects table
ALTER TABLE projects ADD COLUMN published_url text;
ALTER TABLE projects ADD COLUMN subdomain_slug text UNIQUE;
ALTER TABLE projects ADD COLUMN is_static_deployed boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN static_files jsonb; -- {index_html: "...", styles_css: "...", main_js: "..."}
ALTER TABLE projects ADD COLUMN source_paper_url text; -- ArXiv URL or PDF path
ALTER TABLE projects ADD COLUMN generation_metadata jsonb; -- Style variation, model used, etc.

-- Index for slug lookups
CREATE INDEX idx_projects_subdomain_slug ON projects(subdomain_slug) WHERE subdomain_slug IS NOT NULL;

-- Track generation progress
CREATE TABLE bulk_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  total_papers integer NOT NULL,
  completed_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  current_paper_url text,
  style_variation text,
  error_log jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bulk_generation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES bulk_generation_jobs(id) ON DELETE CASCADE,
  paper_url text NOT NULL,
  paper_title text,
  status text NOT NULL DEFAULT 'pending', -- pending, generating, uploading, completed, failed
  project_id uuid REFERENCES projects(id),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

---

### 3. Bulk Generation Script

#### Technology Stack

- **Runtime:** Node.js with TypeScript
- **Claude Integration:** `@anthropic-ai/claude-agent-sdk`
- **Database:** `@supabase/supabase-js` with service role key
- **R2 Upload:** CloudFlare SDK or S3-compatible client
- **PDF Parsing:** `pdf-parse` or similar

#### Script Components

| Component | Purpose |
|-----------|---------|
| `input-parser.ts` | Read ArXiv URLs from file or scan PDF directory |
| `queue-manager.ts` | Track progress, handle resumability |
| `user-selector.ts` | Pick random user from `seeded_test_users` |
| `claude-generator.ts` | Call Claude Agent SDK to generate website |
| `r2-uploader.ts` | Push files to CloudFlare R2 |
| `db-writer.ts` | Create/update project records |
| `rate-limiter.ts` | Delays between generations, respect limits |
| `style-variator.ts` | Generate randomized styling instructions |

#### Claude Agent SDK Integration

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

async function generateWebsite(paperContent: string, styleVariation: string) {
  const prompt = `
Generate an interactive explorable website for this research paper.

PAPER CONTENT:
${paperContent}

STYLE INSTRUCTIONS:
${styleVariation}

Generate three files:
1. index.html - The main HTML structure
2. styles.css - Styling for the page
3. main.js - Interactive JavaScript

Follow the html-developer template patterns.
`;

  const result = query({
    prompt,
    options: {
      model: "claude-sonnet-4-20250514", // or haiku for cost efficiency
      cwd: "/path/to/sandbox-templates/html-developer",
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 10,
      tools: { type: "preset", preset: "claude_code" },
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
        append: "You are generating static explorable research websites."
      }
    }
  });

  // Collect generated files from the result
  for await (const message of result) {
    // Process messages, extract file contents
  }
}
```

#### Style Variations

```typescript
const styleVariations = [
  "Use a dark theme with purple accents and smooth animations",
  "Use a light minimalist theme with blue tones and subtle shadows",
  "Use a scientific journal aesthetic with serif fonts",
  "Use a modern tech startup look with gradients",
  "Use a retro terminal aesthetic with green text on dark background",
  "Use a warm earth-tone palette with rounded corners",
  "Use a high-contrast accessibility-focused design",
  "Use a glassmorphism style with blur effects",
  // ... more variations
];

function getRandomStyleVariation(): string {
  return styleVariations[Math.floor(Math.random() * styleVariations.length)];
}
```

---

### 4. Generation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ For each paper in input list:                                     │
├──────────────────────────────────────────────────────────────────┤
│ 1. Check if already processed (skip if completed)                 │
│ 2. Parse ArXiv URL or load PDF content                           │
│ 3. Extract paper title, abstract, key content                    │
│ 4. Select random user from seeded_test_users                     │
│ 5. Generate unique subdomain slug                                │
│ 6. Create project record (status: "generating")                  │
│ 7. Call Claude Agent SDK with:                                   │
│    - Paper content                                               │
│    - html-developer template context                             │
│    - Randomized style instruction                                │
│ 8. Extract generated files (HTML, CSS, JS)                       │
│ 9. Upload to R2 at projects/{project_id}/                        │
│ 10. Update project record:                                       │
│     - status: "published"                                        │
│     - published_url: https://{slug}.explorableresearch.com       │
│     - static_files: stored file contents                         │
│ 11. Mark item as completed in bulk_generation_items              │
│ 12. Sleep for rate limiting (configurable delay)                 │
│ 13. Continue to next paper                                       │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5. Rate Limiting Strategy

To avoid hitting Claude Code subscription limits:

| Parameter | Value | Reason |
|-----------|-------|--------|
| Delay between generations | 30-60 seconds | Spread load |
| Max generations per hour | ~50-100 | Stay within limits |
| Daily generation target | 100-200 | Sustainable pace |
| Total generation time | 5-15 days | For 1000-1500 websites |

```typescript
const GENERATION_CONFIG = {
  delayBetweenGenerations: 45_000, // 45 seconds
  maxGenerationsPerHour: 80,
  maxRetries: 3,
  retryDelay: 60_000, // 1 minute on failure
  pauseOnRateLimit: 300_000, // 5 minutes if rate limited
};
```

---

### 6. Error Handling & Resumability

#### Error Types

| Error | Action |
|-------|--------|
| Claude generation fails | Retry up to 3 times, then skip and log |
| R2 upload fails | Retry with exponential backoff |
| Rate limit hit | Pause for 5 minutes, then resume |
| Invalid paper (no content) | Skip and mark as failed |
| Network timeout | Retry once, then skip |

#### Progress Tracking

```typescript
// Resume from where we left off
async function resumeGeneration(jobId: string) {
  const pendingItems = await supabase
    .from("bulk_generation_items")
    .select("*")
    .eq("job_id", jobId)
    .in("status", ["pending", "failed"])
    .lt("retry_count", 3)
    .order("created_at");

  for (const item of pendingItems.data) {
    await processItem(item);
  }
}
```

---

## Implementation Phases

### Phase 1: Infrastructure Setup
- [ ] Set up CloudFlare R2 bucket
- [ ] Create CloudFlare Worker for subdomain routing
- [ ] Configure wildcard DNS for `*.explorableresearch.com`
- [ ] Add database schema changes (migration)
- [ ] Test manual upload and serving of static files

### Phase 2: Generation Script Core
- [ ] Create script project structure
- [ ] Implement ArXiv URL parser
- [ ] Implement PDF content extractor
- [ ] Implement Claude Agent SDK integration
- [ ] Implement R2 uploader
- [ ] Implement database operations with service role

### Phase 3: Queue & Resumability
- [ ] Implement job/item tracking tables
- [ ] Add progress tracking and logging
- [ ] Implement resume functionality
- [ ] Add error handling and retries
- [ ] Add rate limiting logic

### Phase 4: Style Variations & Quality
- [ ] Create diverse style variation prompts
- [ ] Test output quality across variations
- [ ] Add validation for generated files
- [ ] Implement quality checks (file size, valid HTML, etc.)

### Phase 5: Execution
- [ ] Prepare input list (ArXiv URLs, PDFs)
- [ ] Run initial batch (10-20) for testing
- [ ] Monitor and adjust rate limits
- [ ] Run full generation over multiple days
- [ ] Review and curate generated content

---

## Open Questions

1. **Paper selection:** Which ArXiv papers to prioritize? Popular CS papers? Diverse fields?

2. **Quality control:** Manual review of generated websites, or automated quality checks only?

3. **User distribution:** Even distribution across seeded users, or weighted (some users have more projects)?

4. **Template forking:** How should other users "fork" these generated projects?
   - Copy entire project + files
   - Reference original as template_source_id
   - Both options available

5. **Custom domains:** Implement now or defer to later?

6. **Caching:** Should we cache paper content to avoid re-fetching on retries?

---

## Cost Estimates

| Item | Estimate |
|------|----------|
| Claude Code subscription | Already covered |
| CloudFlare R2 storage | ~$0.015/GB/month (minimal for text files) |
| CloudFlare Workers | Free tier likely sufficient |
| Total for 1500 websites | < $5/month storage |

---

## Security Considerations

- Use service role key (never expose to client)
- Store service role key in environment variables
- R2 bucket is public-read for serving, but write requires auth
- Generated content should be sanitized (no script injection from paper content)
- Rate limiting prevents runaway costs

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Infrastructure Setup
3. Create the migration for new database fields
4. Set up CloudFlare R2 and Worker
