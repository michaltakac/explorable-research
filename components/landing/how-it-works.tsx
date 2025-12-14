'use client'

import { motion } from 'framer-motion'
import { FileText, Cpu, Globe, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Describe or Upload',
    description: 'Type a description of what you want to visualize, paste an ArXiv link, or upload a research PDF.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Generates',
    description: 'Our AI analyzes your input and generates interactive React code with visualizations and explanations.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    number: '03',
    icon: Globe,
    title: 'Explore & Share',
    description: 'Interact with your explorable in real-time, refine it with follow-up prompts, and share it with others.',
    color: 'from-cyan-500 to-teal-500',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            Three simple steps to{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              understanding
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            From complex research to interactive exploration in minutes, not hours.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Step number with icon */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5`}>
                      <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                        <step.icon className="w-8 h-8 text-foreground" />
                      </div>
                    </div>
                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{step.number}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps (mobile) */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center my-6 lg:hidden">
                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Use cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-muted-foreground mb-6">Perfect for</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Researchers',
              'Students',
              'Educators',
              'Science Communicators',
              'Curious Minds',
              'Data Scientists',
            ].map((role, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
