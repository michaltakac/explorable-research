'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeroProps {
  onGetStarted: () => void
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 via-background to-background dark:from-violet-950/20 dark:via-background dark:to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Powered by advanced AI models
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
          >
            Transform research into{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              interactive experiences
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Turn complex research papers and scientific articles into engaging, 
            explorable websites that anyone can understand and interact with.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/25 border-0 h-14 px-8 text-lg"
            >
              Start Creating
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-14 px-8 text-lg border-2"
              onClick={() => {
                const howItWorksSection = document.getElementById('how-it-works')
                howItWorksSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Example prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              'Visualize gradient descent with adjustable learning rates',
              'Explain the attention mechanism in transformers',
              'Interactive Conway\'s Game of Life simulation',
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={onGetStarted}
                className="group flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all text-left"
              >
                <FileText className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {prompt}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
