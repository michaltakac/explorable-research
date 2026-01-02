export function getTemplateIdSuffix(id: string) {
  const isDev = process.env.NODE_ENV === 'development'
  return isDev ? `${id}-dev` : id
}

export function getTemplateId(id: string) {
  return id.replace(/-dev$/, '')
}

const templates = {
  [getTemplateIdSuffix('html-developer')]: {
    name: 'Static HTML',
    lib: [],
    file: 'index.html',
    instructions:
      `A pure HTML/CSS/JavaScript template with TailwindCSS and Three.js. No build step required - static files served via http-server.

You MUST FOLLOW THE STRUCTURE OF THE TEMPLATE:
├── index.html # Main HTML file with all content structure and TailwindCSS classes
├── style.css # Custom CSS for animations and interactive JS states only
└── main.js # JavaScript with Three.js scenes and interactivity

KEY GUIDELINES:
- This is a NO-BUILD template. All code runs directly in the browser.
- TailwindCSS v4 is loaded from CDN (cdn.tailwindcss.com) with custom config in a <script> tag.
- Three.js is loaded from CDN (cdnjs.cloudflare.com) in index.html.
- Use TailwindCSS utility classes for all layout and styling in HTML.
- Keep style.css minimal - only for custom animations, keyframes, and JS-toggled states.
- Use modern vanilla JavaScript (ES6+), no transpilation.
- Google Fonts loaded via <link> tags in HTML.

TAILWIND CONFIG (in index.html <script>):
- Custom colors: 'nobel-gold' (#C5A059), 'cream' (#F9F8F4), 'cream-light' (#F5F4F0)
- Custom fonts: 'serif' (Playfair Display), 'sans' (Inter)

FEATURES TO IMPLEMENT:
- Responsive navigation with mobile menu toggle
- Smooth scroll to sections
- Three.js 3D scenes (hero background, interactive visualizations)
- Interactive diagrams (click handlers, state management in vanilla JS)
- Animated charts and data visualizations
- CSS animations and transitions

When user provides a link to an ArXiv paper (ignore any other types of links and URLs), 
get the contents of this paper (PDF form available on ArXiv), 
and create an explorable research page from it using HTML with TailwindCSS classes, minimal custom CSS, and vanilla JavaScript.

IMPORTANT: Keep all JavaScript in main.js, interactive state styles in style.css, and structure with Tailwind classes in index.html.
Do not use any frameworks, bundlers, or build tools beyond CDN scripts.`,
    port: 3000,
  },
  [getTemplateIdSuffix('explorable-research-developer')]: {
    name: 'React+Vite web app',
    lib: [
      "react@^19.2.0",
      "react-dom@^19.2.0",
      "@react-three/fiber@^9.4.0",
      "@react-three/drei@^10.7.7",
      "three@^0.181.1",
      "motion@^12.23.25",
      "lucide-react@^0.553.0",
      "@types/node@^22.14.0",
      "@vitejs/plugin-react@^5.0.0",
      "typescript@~5.8.2",
      "vite@^6.2.0"
    ],
    file: 'App.tsx',
    instructions:
      `A single-page app template using React + Vite, that reloads automatically.

You MUST FOLLOW THE STRUCTURE OF THE TEMPLATE:
├── .gitignore
├── App.tsx # Main application component (sections, navigation, content)
├── index.css # Global styles and Tailwind customization
├── index.html # HTML entry point (modify this to change the title of the explorable)
├── index.tsx # React entry point (do not modify)
├── metadata.json
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
├── types.ts
├── vite.config.ts
└── components/ # Example of a folder containing interactive components - rework this structure to fit the needs of the project
    ├── Diagrams.tsx # Example of an interactive diagram component 
    └── QuantumScene.tsx # Example of a 3D visualization component using React Three Fiber (optional)
      
When user provides a link to a ArXiv paper (ignore any other types of links and URLs), 
get the contents of this paper (PDF form available on ArXiv, so you need to access it through web), 
and create an explorable research page from it based on the template provided.`,
    port: 3000,
  },
}

export type Templates = typeof templates
export default templates

export function templatesToPrompt(templates: Templates) {
  return `${Object.entries(templates)
    .map(
      ([id, t], index) =>
        `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies installed: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`,
    )
    .join('\n')}`
}
