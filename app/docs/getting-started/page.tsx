import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBlock } from '@/components/docs/code-block'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Key,
  Link as LinkIcon,
  MessageSquare,
  Upload,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Getting Started',
  description: 'Create your first interactive explorable in just a few minutes.',
}

const steps = [
  {
    title: 'Sign Up',
    description: 'Create a free account to save and manage your explorables.',
    icon: CheckCircle2,
  },
  {
    title: 'Upload or Describe',
    description: 'Upload a research PDF, paste an ArXiv link, or describe your concept.',
    icon: Upload,
  },
  {
    title: 'Generate',
    description: 'Watch as AI transforms your input into an interactive experience.',
    icon: MessageSquare,
  },
  {
    title: 'Explore & Share',
    description: 'Interact with your explorable and share it with others.',
    icon: ExternalLink,
  },
]

export default function GettingStartedPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Getting Started</h1>
        <p className="text-xl text-muted-foreground">
          Create your first interactive explorable in just a few minutes.
        </p>
      </div>

      {/* Steps overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Start</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step.title} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="absolute top-4 right-4 text-4xl font-bold text-muted-foreground/20">
                  {index + 1}
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <step.icon className="h-5 w-5 text-violet-500" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Input methods */}
      <section className="space-y-4">
        <h2 id="input-methods" className="text-2xl font-semibold">
          Ways to Create Explorables
        </h2>
        <p className="text-muted-foreground">
          You can create explorables using several different methods:
        </p>

        <div className="space-y-6">
          {/* Method 1: Text description */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              Text Description
            </h3>
            <p className="text-sm text-muted-foreground">
              Simply describe what you want to visualize or explain. The AI will generate 
              an interactive web application based on your description.
            </p>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm italic">
                &ldquo;Create an interactive visualization of gradient descent showing how 
                learning rate affects convergence. Include adjustable parameters and 
                real-time graphs.&rdquo;
              </p>
            </div>
          </div>

          {/* Method 2: ArXiv link */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              ArXiv Paper Link
            </h3>
            <p className="text-sm text-muted-foreground">
              Paste a link to any ArXiv paper and the AI will analyze it and create 
              an interactive explorable that brings the research to life.
            </p>
            <CodeBlock
              code="https://arxiv.org/abs/2301.07067"
              language="bash"
              title="Example ArXiv URL"
            />
          </div>

          {/* Method 3: PDF upload */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              PDF Upload
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload a PDF of any research paper or document. The AI will extract 
              the content and transform it into an interactive experience.
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: <code className="bg-muted px-1 rounded">PDF</code>
            </p>
          </div>
        </div>
      </section>

      {/* Example walkthrough */}
      <section className="space-y-4">
        <h2 id="example" className="text-2xl font-semibold">
          Example Walkthrough
        </h2>
        <p className="text-muted-foreground">
          Let&apos;s create an interactive visualization of neural network training:
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">1. Go to the Create Page</h3>
            <p className="text-sm text-muted-foreground">
              Navigate to{' '}
              <Link href="/create" className="text-primary hover:underline">
                /create
              </Link>{' '}
              or click the &ldquo;Start Creating&rdquo; button on the homepage.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">2. Enter Your Prompt</h3>
            <p className="text-sm text-muted-foreground">
              Type a description of what you want to create:
            </p>
            <CodeBlock
              code={`Build an interactive neural network visualization that shows:
- The architecture of a simple feedforward network
- Forward propagation with animated data flow
- How weights affect the output
- Adjustable number of layers and neurons`}
              language="bash"
              title="Example Prompt"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">3. Watch the AI Generate</h3>
            <p className="text-sm text-muted-foreground">
              The AI will stream the generated code in real-time. You can see the 
              React components, visualizations, and interactivity being created.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">4. Interact and Refine</h3>
            <p className="text-sm text-muted-foreground">
              Once generated, your explorable runs in a sandboxed preview. You can 
              interact with it and send follow-up messages to refine or add features.
            </p>
          </div>
        </div>
      </section>

      {/* API access */}
      <section className="space-y-4">
        <h2 id="api-access" className="text-2xl font-semibold">
          Programmatic Access
        </h2>
        <p className="text-muted-foreground">
          Want to integrate Explorable Research into your workflow? Use our REST API 
          to create, list, and manage your projects programmatically.
        </p>

        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create an API Key
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Go to{' '}
              <Link href="/profile/api-keys" className="text-primary hover:underline">
                Profile → API Keys
              </Link>
            </li>
            <li>Click &ldquo;Create API Key&rdquo;</li>
            <li>Give it a descriptive name</li>
            <li>Copy the key (it won&apos;t be shown again)</li>
          </ol>

          <h3 className="font-medium mt-6">Make Your First API Request</h3>
          <CodeBlock
            code={`curl -X GET "https://explorableresearch.com/api/projects" \\
  -H "x-api-key: YOUR_API_KEY"`}
            language="curl"
            title="List your projects"
          />
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">Next Steps</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/create">
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/features">
              Explore Features
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/api">
              API Documentation
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

