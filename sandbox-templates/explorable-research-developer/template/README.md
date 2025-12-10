# Explorable Research Template

This template is the foundation for generating interactive, explorable single-page applications that visualize research articles.

## AI Agent Instructions

You are generating an **explorable research visualization** — an interactive web page that transforms a research article into an engaging, educational experience. Study this template structure carefully and create article-specific content following the same patterns.

### Your Task

1. **Read and understand** the research article provided by the user
2. **Identify key concepts** that can be visualized interactively (diagrams, simulations, data visualizations)
3. **Generate a complete single-page application** with the same structure as this template

### Template Structure

```
├── App.tsx           # Main application component (sections, navigation, content)
├── index.tsx         # React entry point (do not modify)
├── index.html        # HTML entry point (do not modify)
├── index.css         # Global styles and Tailwind customization
├── types.ts          # TypeScript type definitions
├── components/
│   ├── Diagrams.tsx      # Interactive diagrams and data visualizations
│   └── QuantumScene.tsx  # 3D visualizations using React Three Fiber (optional)
├── vite.config.ts    # Vite configuration (do not modify)
└── package.json      # Dependencies (do not modify)
```

### Available Dependencies

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility-first styling (via CDN in index.html)
- **@react-three/fiber** & **@react-three/drei** — 3D graphics (optional)
- **three** — 3D library (optional)
- **motion** (Framer Motion) — Animations
- **lucide-react** — Icons

### Design Guidelines

#### Visual Style
- Clean, academic aesthetic with warm stone/cream background colors
- Gold accent color for highlights (`#C5A059` / `nobel-gold`)
- Serif fonts for headings, sans-serif for body text
- Generous whitespace and clear visual hierarchy

#### Page Sections (follow this structure)
1. **Hero Section** — Title, subtitle, publication info, optional 3D scene
2. **Introduction** — Overview of the research problem
3. **Core Concepts** — Interactive diagrams explaining key ideas
4. **Methodology/Innovation** — How the research works
5. **Results** — Data visualizations, performance metrics
6. **Impact** — Significance and future implications
7. **Authors** — Research team credits
8. **Footer** — Paper citation and attribution

#### Interactive Components
Create React components in `components/` that:
- **Respond to user input** (clicks, hovers, sliders)
- **Animate state changes** using motion/framer-motion
- **Visualize data** with charts, diagrams, or simulations
- **Explain concepts** through interactive exploration

Example interactive patterns:
- Click-to-toggle states (like error injection in the Surface Code diagram)
- Animated step-by-step processes (like the Transformer architecture visualization)
- Comparative bar charts with selectable parameters
- Sliders to adjust simulation parameters
- Hover states that reveal additional information

### Code Patterns

#### App.tsx Structure
```tsx
const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll handling for sticky nav
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to sections
  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-stone-800">
      {/* Navigation */}
      {/* Hero Section */}
      {/* Content Sections */}
      {/* Footer */}
    </div>
  );
};
```

#### Interactive Diagram Pattern
```tsx
export const ConceptDiagram: React.FC = () => {
  const [activeState, setActiveState] = useState(initialState);
  
  return (
    <div className="p-8 bg-white rounded-xl border border-stone-200">
      <h3 className="font-serif text-xl mb-4">Interactive: Concept Name</h3>
      <p className="text-sm text-stone-500 mb-6">
        Instructions for user interaction...
      </p>
      
      {/* Interactive visualization */}
      <div className="relative">
        {/* Clickable/interactive elements */}
        <motion.div
          animate={{ /* state-based animations */ }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          {/* Visual content */}
        </motion.div>
      </div>
      
      {/* Legend or status */}
      <div className="mt-4 text-sm text-stone-600">
        {/* Feedback based on current state */}
      </div>
    </div>
  );
};
```

### Important Notes

- **Do not modify**: `index.tsx`, `index.html`, `vite.config.ts`, `package.json`
- **Main files to edit**: `App.tsx`, `components/*.tsx`, `types.ts`, `index.css`
- All components should be self-contained and reusable
- Use TypeScript for type safety
- Include appropriate SPDX license headers in generated files
- Attribute the original research paper in the footer

### Example Transformation

**Input**: A research paper about neural network optimization  
**Output**: An explorable page with:
- Hero with animated neural network visualization
- Interactive diagram showing gradient flow
- Slider to adjust learning rate and see convergence behavior
- Comparative chart of optimization methods
- Step-by-step animation of backpropagation

Generate content that helps readers **understand and explore** the research, not just read about it.
