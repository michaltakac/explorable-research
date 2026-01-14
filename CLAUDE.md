# Claude Instructions for Explorable Research

## Project Purpose

Transform research papers (PDF/ArXiv) into interactive, explorable web applications with visualizations, animations, and user interactions.

## When Modifying Code

### UI Components
- Use shadcn/ui components from `components/ui/`
- Follow existing patterns in `components/` for feature components
- Radix primitives for accessibility
- Tailwind for styling, avoid inline styles

### API Routes
- Located in `app/api/`
- Use `handleAPIError()` from `lib/api-errors.ts` for error handling
- Rate limiting via `lib/ratelimit.ts`
- Auth via Supabase: `createSupabaseServerClient()` for server, `supabase` singleton for client

### Database Changes
- Create migrations in `supabase/migrations/` with timestamp prefix
- Use `mcp_supabase_development_apply_migration` for DDL
- RLS policies required for all tables

### Adding AI Models
Edit `lib/models.json` with OpenRouter model ID format.

### Adding Templates
1. Create folder in `sandbox-templates/`
2. Add E2B config (`e2b.toml`, `e2b.Dockerfile`)
3. Register in `lib/templates.ts`

## File Patterns

| Task | Location |
|------|----------|
| New page | `app/[route]/page.tsx` |
| API endpoint | `app/api/[name]/route.ts` |
| Reusable component | `components/[name].tsx` |
| UI primitive | `components/ui/[name].tsx` |
| Utility function | `lib/[name].ts` |
| Type definitions | `lib/types.ts` or colocated |

## Testing

```bash
npm run test              # Run all tests
npm run test -- [file]    # Run specific test
```

Tests in `lib/__tests__/`. Use vitest with jsdom.

## Common Imports

```typescript
// Supabase
import { supabase } from '@/lib/supabase'           // Client singleton
import { createSupabaseServerClient } from '@/lib/supabase-server'  // Server

// UI
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Types
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
```

## Auth Pattern

Client components:
```typescript
const [session, setSession] = useState<Session | null>(null)
useEffect(() => {
  if (!supabase) return
  supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session))
  return () => subscription.unsubscribe()
}, [])
```

## Don't

- Modify `package.json` dependencies in generated code
- Use `createClient` from `@/lib/supabase` (use `supabase` singleton)
- Skip TypeScript types
- Add features beyond what's requested
- Create documentation files unless asked
