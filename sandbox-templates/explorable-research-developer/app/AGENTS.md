# AI Agent Instructions

You are an AI agent generating code inside an E2B sandbox environment. Your task is to create **explorable research visualizations** — interactive web pages that transform research articles into engaging, educational experiences.

## Environment

- **Runtime**: Node.js 24 with npm
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS (via CDN)
- **Working Directory**: `/home/user`
- **Dev Server**: `npm run dev` on port 3000 (auto-started)

## File Structure

```
/home/user/
├── AGENTS.md         # This file (read-only reference)
├── README.md         # Template documentation
├── App.tsx           # ⭐ Main application component - PRIMARY EDIT TARGET
├── index.tsx         # React entry point (DO NOT MODIFY)
├── index.html        # HTML entry point (DO NOT MODIFY)
├── index.css         # Global styles and Tailwind customization
├── types.ts          # TypeScript type definitions
├── metadata.json     # Project metadata
├── components/       # ⭐ Interactive components - CREATE/EDIT HERE
│   ├── Diagrams.tsx      # Interactive diagrams and data visualizations
│   └── QuantumScene.tsx  # 3D visualizations (React Three Fiber)
├── vite.config.ts    # Vite configuration (DO NOT MODIFY)
├── package.json      # Dependencies (DO NOT MODIFY)
└── tsconfig.json     # TypeScript config (DO NOT MODIFY)
```

## Available Dependencies

Already installed and ready to import:

```typescript
// React
import React, { useState, useEffect, useRef } from 'react';

// Animations
import { motion } from 'motion/react';

// Icons
import { ArrowDown, Menu, X, BookOpen, Activity, Cpu, BarChart2 } from 'lucide-react';

// 3D Graphics (optional)
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
```

## Your Task

1. **Read** the research article/paper provided by the user
2. **Identify** key concepts that can be visualized interactively
3. **Generate** React components following the patterns below
4. **Edit** `App.tsx` and files in `components/`

## Code Generation Rules

### DO ✅
- Edit `App.tsx` to customize content, sections, and layout
- Create new components in `components/` directory
- Edit `index.css` for custom Tailwind theme extensions
- Edit `types.ts` for TypeScript interfaces
- Use TailwindCSS utility classes for styling
- Use `motion` for animations
- Use `lucide-react` for icons
- Include SPDX license headers: `/** @license SPDX-License-Identifier: Apache-2.0 */`

### DO NOT ❌
- Modify `index.tsx`, `index.html`, `vite.config.ts`, `package.json`
- Install new npm packages (use only what's available)
- Use inline styles when Tailwind classes exist
- Create files outside `/home/user/`

## Design System

### Colors
```
Background:  #F9F8F4 (cream)      - bg-[#F9F8F4]
Light:       #F5F4F0 (cream-light)
Accent:      #C5A059 (nobel-gold) - text-nobel-gold, bg-nobel-gold
Text:        stone-800, stone-600, stone-500, stone-400
Dark:        stone-900
```

### Typography
- **Headings**: `font-serif` (Playfair Display)
- **Body**: `font-sans` (Inter) - default
- **Hero titles**: `text-5xl md:text-7xl lg:text-9xl`
- **Section titles**: `text-4xl md:text-5xl`

### Page Structure
```tsx
<div className="min-h-screen bg-[#F9F8F4] text-stone-800">
  {/* 1. Navigation - fixed, with scroll state */}
  {/* 2. Hero Section - full viewport height */}
  {/* 3. Introduction - research problem overview */}
  {/* 4. Core Concepts - interactive diagrams */}
  {/* 5. Methodology - how it works */}
  {/* 6. Results - data visualizations */}
  {/* 7. Impact - significance */}
  {/* 8. Authors - team credits */}
  {/* 9. Footer - paper citation */}
</div>
```

## Interactive Component Pattern

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';

export const InteractiveDiagram: React.FC = () => {
  const [activeItems, setActiveItems] = useState<number[]>([]);
  
  const toggleItem = (id: number) => {
    setActiveItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8 bg-white rounded-xl border border-stone-200">
      <h3 className="font-serif text-xl mb-4">Interactive: Concept Name</h3>
      <p className="text-sm text-stone-500 mb-6">
        Click elements to explore...
      </p>
      
      <div className="relative">
        {items.map(item => (
          <motion.button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            animate={{ 
              scale: activeItems.includes(item.id) ? 1.1 : 1,
              backgroundColor: activeItems.includes(item.id) ? '#3B82F6' : '#D6D3D1'
            }}
            className="absolute w-8 h-8 rounded-full"
            style={{ left: item.x, top: item.y }}
          />
        ))}
      </div>
      
      <div className="mt-4 text-sm font-serif italic text-stone-600">
        {activeItems.length === 0 ? 'System is stable.' : `${activeItems.length} items selected.`}
      </div>
    </div>
  );
};
```

## 3D Scene Pattern (Optional)

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

const AnimatedSphere = () => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <Sphere ref={ref} args={[1, 32, 32]}>
      <MeshDistortMaterial color="#4F46E5" distort={0.4} speed={2} />
    </Sphere>
  );
};

export const HeroScene: React.FC = () => (
  <div className="absolute inset-0 z-0 opacity-60">
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Float speed={1.5} rotationIntensity={0.2}>
        <AnimatedSphere />
      </Float>
    </Canvas>
  </div>
);
```

## Example Output

For a paper about "Quantum Error Correction with Machine Learning":

1. **Hero**: Animated quantum particles with wireframe torus
2. **Introduction**: Drop cap, two-column layout explaining the noise problem
3. **Surface Code Diagram**: Click data qubits to inject errors, watch stabilizers light up
4. **Architecture Visualization**: Auto-cycling animation showing transformer processing
5. **Performance Chart**: Bar chart with distance selector buttons
6. **Impact Section**: 3D quantum computer model, blockquote from paper
7. **Authors**: Card grid with names and affiliations
8. **Footer**: DOI link and attribution

## Debugging

- Dev server auto-reloads on file changes
- Check browser console for React errors
- TypeScript errors will show in terminal
- If stuck, check `README.md` for more examples

