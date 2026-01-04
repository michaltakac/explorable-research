import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/docs/code-block'
import { ArrowRight, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Creating Explorables',
  description: 'Learn how to create interactive explorables with effective prompts.',
}

export default function CreatingExplorablesPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Creating Explorables</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to write effective prompts and create engaging interactive experiences.
        </p>
      </div>

      {/* Introduction */}
      <section className="space-y-4">
        <h2 id="introduction" className="text-2xl font-semibold">
          Introduction
        </h2>
        <p className="text-muted-foreground">
          The key to creating great explorables is writing clear, specific prompts that 
          guide the AI to generate exactly what you need. This guide will teach you how 
          to craft prompts that produce high-quality interactive visualizations.
        </p>
      </section>

      {/* Anatomy of a good prompt */}
      <section className="space-y-4">
        <h2 id="good-prompts" className="text-2xl font-semibold">
          Anatomy of a Good Prompt
        </h2>
        <p className="text-muted-foreground">
          A well-structured prompt typically includes these elements:
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Clear Objective</h3>
              <p className="text-sm text-muted-foreground mt-1">
                State what you want to visualize or explain. Be specific about the concept.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Interactive Elements</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Describe what users should be able to control, adjust, or interact with.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Visual Requirements</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mention specific visualizations like graphs, 3D models, or animations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Context & Explanation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Request explanatory text that helps users understand the concept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="space-y-4">
        <h2 id="examples" className="text-2xl font-semibold">
          Example Prompts
        </h2>

        <div className="space-y-6">
          {/* Example 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Machine Learning Concepts</h3>
            <CodeBlock
              code={`Create an interactive visualization of gradient descent that shows:
- A 3D surface plot of a loss function
- An animated ball rolling down the surface
- Adjustable learning rate slider (0.001 to 1.0)
- Step counter showing iterations
- Real-time loss value display
- Comparison of different learning rates side by side
Include explanatory text about how learning rate affects convergence.`}
              language="bash"
              title="Good prompt"
            />
            <p className="text-sm text-muted-foreground">
              This prompt is specific about the visualization type, interactive elements, 
              and educational content.
            </p>
          </div>

          {/* Example 2 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Physics Simulation</h3>
            <CodeBlock
              code={`Build an interactive pendulum simulation with:
- Animated pendulum that responds to physics
- Adjustable length, mass, and gravity
- Real-time energy graphs (kinetic, potential, total)
- Damping control for realistic decay
- Reset button to restore initial conditions
- Phase space diagram showing position vs velocity
Add explanations about harmonic motion and energy conservation.`}
              language="bash"
              title="Good prompt"
            />
          </div>

          {/* Example 3 */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Data Visualization</h3>
            <CodeBlock
              code={`Create an explorable about sorting algorithms:
- Visual comparison of Bubble Sort, Quick Sort, and Merge Sort
- Animated step-by-step execution
- Speed control slider
- Array size selector (10 to 100 elements)
- Step counter and comparison count
- Time complexity explanation for each algorithm
Use colorful bar charts where sorted elements turn green.`}
              language="bash"
              title="Good prompt"
            />
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 id="tips" className="text-2xl font-semibold">
          Tips for Better Results
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Be Specific About Interactivity
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Instead of &ldquo;make it interactive,&rdquo; specify exactly what controls you want: 
                sliders, buttons, dropdowns, drag interactions, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Request Visual Details
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Mention specific visualization types: &ldquo;line chart,&rdquo; &ldquo;3D scatter plot,&rdquo; 
                &ldquo;animated flow diagram,&rdquo; etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Include Educational Goals
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tell the AI what users should learn. This helps it generate appropriate 
                explanations and highlight key concepts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Lightbulb className="h-5 w-5 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-violet-600 dark:text-violet-400">
                Iterate and Refine
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                After the initial generation, use follow-up messages to refine. 
                Ask for specific changes or additions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common mistakes */}
      <section className="space-y-4">
        <h2 id="common-mistakes" className="text-2xl font-semibold">
          Common Mistakes to Avoid
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">Too Vague</h3>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="line-through">&ldquo;Show me how neural networks work&rdquo;</span>
                {' → '}
                Be specific about what aspect: architecture, training, forward pass, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">Too Complex</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Don&apos;t ask for everything at once. Focus on one concept and add more 
                in follow-up messages.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive">No Interactivity</h3>
              <p className="text-sm text-muted-foreground mt-1">
                An explorable should be interactive. Always include what users can 
                control or adjust.
              </p>
            </div>
          </div>
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
            <Link href="/docs/guides/arxiv-papers">
              Working with ArXiv Papers
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

