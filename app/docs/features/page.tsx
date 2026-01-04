import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  Shield,
  Zap,
  FileText,
  Box,
  Play,
  Code2,
  Palette,
  Globe,
  Eye,
  Share2,
  RefreshCw,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Discover all the powerful features of Explorable Research.',
}

const coreFeatures = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description:
      'Describe your concept in natural language and watch as advanced AI models transform it into a fully interactive web experience. Supports multiple AI providers including OpenAI, Anthropic, and Google.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Secure Sandboxed Execution',
    description:
      'All generated code runs in isolated E2B sandbox environments, ensuring complete safety and reliability. Your explorables execute in secure containers separate from your local machine.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description:
      'Watch your explorable come to life with live streaming updates. See the code being generated in real-time, with immediate preview updates as components are created.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    icon: FileText,
    title: 'ArXiv Paper Support',
    description:
      'Paste a link to any ArXiv paper and get an interactive explorable that brings the research to life. The AI extracts key concepts, equations, and visualizations from the paper.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
]

const visualFeatures = [
  {
    icon: Box,
    title: '3D Visualizations',
    description:
      'Built-in support for Three.js and React Three Fiber enables stunning 3D interactive visualizations. Perfect for complex spatial data, molecular structures, or geometric concepts.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Play,
    title: 'Smooth Animations',
    description:
      'Framer Motion integration allows for beautiful, fluid animations that enhance understanding. Animate data flows, transitions, and interactive elements with ease.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Palette,
    title: 'Beautiful by Default',
    description:
      'Every generated explorable is styled with care using Tailwind CSS, featuring clean typography, thoughtful layouts, and professional design that adapts to light and dark themes.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]

const developerFeatures = [
  {
    icon: Code2,
    title: 'Modern Tech Stack',
    description:
      'React, TypeScript, Vite, and Tailwind CSS ensure fast, responsive, and maintainable explorables. Generated code follows best practices and is easy to understand.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Globe,
    title: 'REST API',
    description:
      'Full programmatic access via REST API. List projects, retrieve data, and integrate Explorable Research into your workflows using API keys.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: RefreshCw,
    title: 'Iterative Refinement',
    description:
      'Continue conversations to refine your explorables. Ask for changes, add new features, or modify existing visualizations through natural language.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
]

const additionalFeatures = [
  {
    icon: Eye,
    title: 'Live Preview',
    description: 'See your explorable running in real-time as code is generated.',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description: 'Share your explorables with a unique URL for others to view.',
  },
]

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className={`inline-flex p-2 rounded-lg ${bgColor} w-fit`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

export default function FeaturesPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Features</h1>
        <p className="text-xl text-muted-foreground">
          Discover the powerful capabilities that make Explorable Research unique.
        </p>
      </div>

      {/* Core Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Core Features</h2>
        <p className="text-muted-foreground">
          The foundational capabilities that power every explorable.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Visual Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Visualization</h2>
        <p className="text-muted-foreground">
          Create stunning visual experiences with built-in support for modern graphics.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {visualFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Developer Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Developer Experience</h2>
        <p className="text-muted-foreground">
          Built for developers who want control and flexibility.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {developerFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Additional Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">And More</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {additionalFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card"
            >
              <div className="p-2 rounded-lg bg-muted">
                <feature.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Models */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Supported AI Models</h2>
        <p className="text-muted-foreground">
          Choose from a variety of state-of-the-art AI models via OpenRouter:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { provider: 'OpenAI', models: 'GPT-5.2, GPT-5.1, GPT-5.1 Codex' },
            { provider: 'Anthropic', models: 'Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.5 Opus' },
            { provider: 'Google', models: 'Gemini 3 Pro Preview' },
            { provider: 'xAI', models: 'Grok 4.1 Fast' },
          ].map((item) => (
            <div
              key={item.provider}
              className="p-3 rounded-lg border bg-card text-sm"
            >
              <span className="font-medium">{item.provider}</span>
              <span className="text-muted-foreground block mt-0.5">
                {item.models}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">Tech Stack</h2>
        <p className="text-muted-foreground">
          Generated explorables use a modern, battle-tested technology stack:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            'React 19',
            'TypeScript',
            'Vite',
            'Tailwind CSS',
            'Three.js',
            'React Three Fiber',
            'Motion',
            'Lucide React',
          ].map((tech) => (
            <div
              key={tech}
              className="px-3 py-2 rounded-lg bg-muted text-center text-sm font-medium"
            >
              {tech}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

