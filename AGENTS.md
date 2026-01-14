# Explorable Research - Agent Guide

AI-powered platform transforming research papers into interactive web experiences.

## Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **UI**: React 18, Tailwind CSS, shadcn/ui, Radix primitives
- **AI**: Vercel AI SDK, OpenRouter (multi-model), Morph (code edits)
- **Sandbox**: E2B SDK (secure code execution)
- **Database**: Supabase (Postgres, Auth, Storage)
- **Animations**: Framer Motion, Three.js/R3F

## Architecture

```
app/
├── api/           # API routes (chat, projects, pdf, sandbox, v1/)
├── create/        # Main explorable creation page
├── docs/          # Documentation pages
├── p/[project_id] # Published project viewer
├── profile/       # User profile & API keys
└── projects/      # User's project list

components/
├── docs/          # Documentation components
├── landing/       # Landing page sections
├── ui/            # shadcn/ui components
└── *.tsx          # Feature components (chat, preview, auth)

lib/
├── prompt.ts      # System prompt for AI generation
├── schema.ts      # Zod schemas (fragment, morph edit)
├── templates.ts   # Sandbox templates config
├── models.ts      # LLM model configuration
├── sandbox.ts     # E2B sandbox management
└── supabase*.ts   # Database clients
```

## Key Concepts

### Fragment
Generated code artifact with metadata:
- `template`: sandbox template ID
- `code`: generated source code
- `file_path`: target file in sandbox
- `additional_dependencies`: npm packages to install

### Templates
Two sandbox environments in `sandbox-templates/`:
1. **html-developer**: Static HTML/CSS/JS with TailwindCSS CDN, Three.js
2. **explorable-research-developer**: React+Vite+TypeScript, R3F, Motion

### Generation Flow
1. User uploads PDF or describes research → `app/api/chat/route.ts`
2. AI streams structured output via `streamObject()` → `lib/schema.ts`
3. Code executes in E2B sandbox → `lib/sandbox.ts`
4. Preview renders via iframe → `components/fragment-web.tsx`

## Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run test     # Run vitest tests
npm run lint     # ESLint
```

## Environment Variables

Required:
- `E2B_API_KEY` - E2B sandbox execution
- `OPENROUTER_API_KEY` - AI model access

Optional:
- `MORPH_API_KEY` - Token-efficient code edits
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database
- `KV_REST_API_*` - Rate limiting (Vercel KV)

## Database

Supabase with KeyHippo extension for API key management.

Tables: `projects` (user projects with code/metadata)

Migrations in `supabase/migrations/`. Run locally with `supabase start`.

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Server components by default, `'use client'` when needed
- Zod for runtime validation
- Path aliases: `@/` → project root
