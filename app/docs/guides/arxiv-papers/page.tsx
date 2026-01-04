import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/docs/code-block'
import { ArrowRight, Lightbulb, FileText, Link as LinkIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Working with ArXiv Papers',
  description: 'Transform academic papers from ArXiv into interactive explorables.',
}

export default function ArxivPapersPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Working with ArXiv Papers</h1>
        <p className="text-xl text-muted-foreground">
          Transform academic research papers into interactive, explorable experiences.
        </p>
      </div>

      {/* Introduction */}
      <section className="space-y-4">
        <h2 id="introduction" className="text-2xl font-semibold">
          Introduction
        </h2>
        <p className="text-muted-foreground">
          ArXiv is a repository of electronic preprints for scientific papers. Explorable 
          Research can transform these papers into interactive visualizations that make 
          complex research accessible to everyone.
        </p>
      </section>

      {/* How to use */}
      <section className="space-y-4">
        <h2 id="how-to-use" className="text-2xl font-semibold">
          How to Use ArXiv Papers
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              Step 1: Find the Paper
            </h3>
            <p className="text-sm text-muted-foreground">
              Go to{' '}
              <a
                href="https://arxiv.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                arxiv.org
              </a>{' '}
              and find the paper you want to visualize. Copy the URL from your browser.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Step 2: Paste the URL
            </h3>
            <p className="text-sm text-muted-foreground">
              Go to the{' '}
              <Link href="/create" className="text-primary hover:underline">
                Create page
              </Link>{' '}
              and paste the ArXiv URL in the input field. The system accepts multiple URL formats:
            </p>
            <CodeBlock
              code={`# Abstract page URL
https://arxiv.org/abs/2301.07067

# PDF URL
https://arxiv.org/pdf/2301.07067.pdf

# Just the arXiv ID
2301.07067`}
              language="bash"
              title="Supported URL formats"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Step 3: Add Context (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              You can add additional instructions to guide the AI on what aspects of 
              the paper to focus on:
            </p>
            <CodeBlock
              code={`https://arxiv.org/abs/2301.07067

Focus on the attention mechanism described in Section 3.
Include an interactive visualization of the self-attention weights.`}
              language="bash"
              title="Adding context"
            />
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 id="tips" className="text-2xl font-semibold">
          Tips for Best Results
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Focus on Key Concepts
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Research papers often have many ideas. Specify which concept, figure, 
                or algorithm you want to visualize for better results.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Reference Specific Sections
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Point to specific sections, figures, or equations: &ldquo;Visualize the 
                architecture from Figure 2&rdquo; or &ldquo;Explain Equation 5 interactively.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Simplify Complex Papers
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                For very complex papers, ask the AI to create a simplified explanation 
                first, then add interactive elements.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Iterate on Results
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use follow-up messages to refine the explorable. Ask for more detail 
                on specific concepts or additional interactivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="space-y-4">
        <h2 id="examples" className="text-2xl font-semibold">
          Example Use Cases
        </h2>

        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Transformer Architecture</h3>
            <CodeBlock
              code={`https://arxiv.org/abs/1706.03762

Create an interactive visualization of the transformer architecture
showing how self-attention works. Include:
- Step-by-step attention calculation
- Query, Key, Value visualization
- Multi-head attention animation
- Position encoding explanation`}
              language="bash"
              title="Attention Is All You Need"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Diffusion Models</h3>
            <CodeBlock
              code={`https://arxiv.org/abs/2006.11239

Visualize the denoising process in diffusion models:
- Forward diffusion (adding noise step by step)
- Reverse diffusion (denoising)
- Interactive noise level slider
- Show how images are generated from noise`}
              language="bash"
              title="Denoising Diffusion Probabilistic Models"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">Graph Neural Networks</h3>
            <CodeBlock
              code={`https://arxiv.org/abs/1609.02907

Create an explorable about Graph Convolutional Networks:
- Interactive graph with draggable nodes
- Message passing visualization
- Feature aggregation animation
- Node classification demo`}
              language="bash"
              title="Semi-Supervised Classification with GCNs"
            />
          </div>
        </div>
      </section>

      {/* Supported paper types */}
      <section className="space-y-4">
        <h2 id="paper-types" className="text-2xl font-semibold">
          What Types of Papers Work Best?
        </h2>
        <p className="text-muted-foreground">
          While Explorable Research can handle any paper, certain types produce 
          particularly good results:
        </p>

        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Machine Learning papers</strong> – 
            Neural network architectures, training algorithms, optimization methods
          </li>
          <li>
            <strong className="text-foreground">Computer Vision papers</strong> – 
            Image processing, object detection, generative models
          </li>
          <li>
            <strong className="text-foreground">Physics papers</strong> – 
            Simulations, mathematical models, physical systems
          </li>
          <li>
            <strong className="text-foreground">Algorithms papers</strong> – 
            Data structures, graph algorithms, optimization
          </li>
          <li>
            <strong className="text-foreground">Mathematics papers</strong> – 
            Geometric concepts, statistical methods, probability
          </li>
        </ul>
      </section>

      {/* Limitations */}
      <section className="space-y-4">
        <h2 id="limitations" className="text-2xl font-semibold">
          Limitations
        </h2>
        <p className="text-muted-foreground">
          Keep these limitations in mind when working with ArXiv papers:
        </p>

        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Very long papers may not be fully processed – focus on specific sections</li>
          <li>Papers with complex mathematical notation may need additional guidance</li>
          <li>Domain-specific jargon might need explanation for the AI</li>
          <li>Papers requiring proprietary data cannot be fully reproduced</li>
        </ul>
      </section>

      {/* Next steps */}
      <section className="space-y-4 pb-8">
        <h2 className="text-2xl font-semibold">Next Steps</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/create">
              Try with a Paper
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs/features">
              See All Features
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

