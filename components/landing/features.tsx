'use client'

import { 
  Sparkles, 
  Shield, 
  Zap, 
  Code2, 
  FileText, 
  Palette,
  Box,
  Play
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Generation',
    description: 'Describe your concept in natural language and watch as AI transforms it into a fully interactive web experience.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    icon: Shield,
    title: 'Secure Sandboxed Execution',
    description: 'All generated code runs in isolated E2B sandbox environments, ensuring safety and reliability.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    icon: Zap,
    title: 'Real-time Streaming',
    description: 'Watch your explorable come to life with live streaming updates as the AI generates your content.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    icon: FileText,
    title: 'ArXiv Paper Support',
    description: 'Paste a link to any ArXiv paper and get an interactive explorable that brings the research to life.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: Box,
    title: '3D Visualizations',
    description: 'Built-in support for Three.js and React Three Fiber enables stunning 3D interactive visualizations.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    icon: Play,
    title: 'Smooth Animations',
    description: 'Framer Motion integration allows for beautiful, fluid animations that enhance understanding.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    icon: Code2,
    title: 'Modern Tech Stack',
    description: 'React, TypeScript, Vite, and Tailwind CSS ensure fast, responsive, and maintainable explorables.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    icon: Palette,
    title: 'Beautiful by Default',
    description: 'Every generated explorable is styled with care, featuring clean typography and thoughtful layouts.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
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
            Everything you need to make research{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              accessible
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Powerful features designed to transform complex ideas into interactive, 
            understandable experiences for everyone.
          </motion.p>
        </div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

