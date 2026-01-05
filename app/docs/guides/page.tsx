import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, FileText, Code2, Key } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Step-by-step guides for using Explorable Research.',
}

const guides = [
  {
    title: 'Creating Explorables',
    description:
      'Learn how to create interactive explorables from scratch using text prompts, with tips for getting the best results.',
    href: '/docs/guides/creating-explorables',
    icon: Layers,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    title: 'Working with ArXiv Papers',
    description:
      'Transform academic papers from ArXiv into interactive experiences. Learn best practices for research visualization.',
    href: '/docs/guides/arxiv-papers',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'API Integration',
    description:
      'Use the REST API to integrate Explorable Research into your applications and workflows.',
    href: '/docs/api',
    icon: Code2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'API Keys',
    description:
      'Create and manage API keys for programmatic access to your data.',
    href: '/docs/api-keys',
    icon: Key,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

export default function GuidesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Guides</h1>
        <p className="text-xl text-muted-foreground">
          Step-by-step tutorials to help you get the most out of Explorable Research.
        </p>
      </div>

      {/* Guides grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {guides.map((guide) => (
          <Link key={guide.href} href={guide.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-violet-500/50">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${guide.bgColor}`}>
                    <guide.icon className={`h-5 w-5 ${guide.color}`} />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}


