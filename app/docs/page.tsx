import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Rocket,
  Sparkles,
  BookOpen,
  Code2,
  Key,
  ArrowRight,
  FileText,
  Cpu,
  Globe,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use Explorable Research to transform research papers into interactive experiences.',
}

const quickLinks = [
  {
    title: 'Getting Started',
    description: 'Create your first interactive explorable in minutes.',
    href: '/docs/getting-started',
    icon: Rocket,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    title: 'Features',
    description: 'Discover all the powerful features available.',
    href: '/docs/features',
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    title: 'Guides',
    description: 'Step-by-step tutorials for common tasks.',
    href: '/docs/guides/creating-explorables',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'API Reference',
    description: 'Integrate with our REST API programmatically.',
    href: '/docs/api',
    icon: Code2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
]

const highlights = [
  {
    icon: FileText,
    title: 'PDF & ArXiv Support',
    description: 'Upload PDFs or paste ArXiv links to generate explorables from research papers.',
  },
  {
    icon: Cpu,
    title: 'AI-Powered',
    description: 'Advanced AI models analyze and transform complex research into interactive experiences.',
  },
  {
    icon: Globe,
    title: 'Instant Deployment',
    description: 'Your explorables run in secure sandboxed environments, ready to share instantly.',
  },
]

export default function DocsOverviewPage() {
  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Explorable Research
          </span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Transform complex research papers into engaging, interactive web experiences 
          that anyone can understand and explore.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/docs/getting-started">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/api">
              <Code2 className="mr-2 h-4 w-4" />
              API Reference
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick links */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-violet-500/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${link.bgColor}`}>
                      <link.icon className={`h-5 w-5 ${link.color}`} />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* What is Explorable Research */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What is Explorable Research?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Explorable Research is an AI-powered platform that transforms dense academic 
          papers and research articles into interactive, explorable web experiences. 
          Simply upload a PDF, paste an ArXiv link, or describe what you want to visualize, 
          and our AI will generate a fully interactive web application.
        </p>
        <div className="grid gap-6 sm:grid-cols-3 pt-4">
          {highlights.map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="p-2 w-fit rounded-lg bg-muted">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
              1
            </div>
            <div>
              <h3 className="font-medium">Upload or Describe</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload a research PDF, paste an ArXiv link, or describe what you want to visualize.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              2
            </div>
            <div>
              <h3 className="font-medium">AI Generates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI analyzes your input and generates interactive React code with visualizations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
              3
            </div>
            <div>
              <h3 className="font-medium">Explore & Share</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Interact with your explorable in real-time, refine it, and share it with others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Access */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Programmatic Access</h2>
        <p className="text-muted-foreground">
          Access your projects and data programmatically using our REST API. 
          Create API keys to integrate Explorable Research with your workflows.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/docs/api-keys">
              <Key className="mr-2 h-4 w-4" />
              API Keys Guide
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/api">
              View API Docs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Support */}
      <section className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">Need Help?</h2>
        <p className="text-muted-foreground">
          Check out our guides for detailed tutorials, or reach out on GitHub for support.
        </p>
        <Button variant="link" className="p-0 h-auto" asChild>
          <a 
            href="https://github.com/michaltakac/explorable-research/issues" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Open an issue on GitHub →
          </a>
        </Button>
      </section>
    </div>
  )
}

