# Static HTML Explorable Template

This template is the foundation for generating interactive, explorable single-page applications using pure HTML, CSS, and JavaScript — no build step required.

## AI Agent Instructions

You are generating an **explorable research visualization** — an interactive web page that transforms a research article into an engaging, educational experience. Study this template structure carefully and create article-specific content following the same patterns.

### Your Task

1. **Read and understand** the research article provided by the user
2. **Identify key concepts** that can be visualized interactively (diagrams, simulations, data visualizations)
3. **Generate a complete static website** with the same structure as this template

### Template Structure

```
├── index.html    # Main HTML file with content, TailwindCSS classes, and CDN scripts
├── style.css     # Custom CSS for animations and JS-toggled interactive states
└── main.js       # Vanilla JavaScript for interactivity and Three.js scenes
```

### Available Libraries (via CDN)

- **TailwindCSS** — Utility-first styling (cdn.tailwindcss.com)
- **Three.js r128** — 3D graphics (cdnjs.cloudflare.com)
- **Google Fonts** — Typography (fonts.googleapis.com)

No npm, no bundlers, no transpilation — everything runs directly in the browser.

### Design Guidelines

#### Visual Style
- Clean, academic aesthetic with warm stone/cream background colors
- Gold accent color for highlights (`#C5A059` / `nobel-gold`)
- Serif fonts for headings (Playfair Display), sans-serif for body text (Inter)
- Generous whitespace and clear visual hierarchy

#### Tailwind Configuration (in index.html)
```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'nobel-gold': '#C5A059',
          'cream': '#F9F8F4',
          'cream-light': '#F5F4F0',
        },
        fontFamily: {
          'serif': ['Playfair Display', 'Georgia', 'serif'],
          'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        },
      }
    }
  }
</script>
```

#### Page Sections (follow this structure)
1. **Navigation** — Fixed header with smooth scroll links and mobile menu
2. **Hero Section** — Title, subtitle, publication info, optional Three.js background
3. **Introduction** — Overview of the research problem
4. **Core Concepts** — Interactive diagrams explaining key ideas
5. **Methodology/Innovation** — How the research works
6. **Results** — Data visualizations, performance metrics
7. **Impact** — Significance and future implications
8. **Authors** — Research team credits
9. **Footer** — Paper citation and attribution

### Code Patterns

#### index.html Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research Title</title>
  
  <!-- TailwindCSS from CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { /* custom theme */ }
  </script>
  
  <!-- Custom CSS for animations/states -->
  <link rel="stylesheet" href="style.css">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="font-sans bg-cream text-stone-800 antialiased">
  <!-- Navigation -->
  <!-- Hero Section -->
  <!-- Content Sections -->
  <!-- Footer -->
  
  <!-- Three.js from CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="main.js"></script>
</body>
</html>
```

#### Interactive Diagram Pattern (main.js)
```javascript
// Get DOM elements
const container = document.getElementById('diagramContainer');
const statusText = document.getElementById('statusText');
const interactiveElements = container.querySelectorAll('.interactive-item');

// State management
let state = new Set();

// Update function
function updateDiagram() {
  // Calculate derived state
  const activeItems = calculateActiveItems(state);
  
  // Update DOM
  interactiveElements.forEach(el => {
    const id = parseInt(el.dataset.id);
    el.classList.toggle('active', activeItems.includes(id));
  });
  
  // Update status text
  statusText.textContent = state.size === 0 
    ? 'Initial state message.' 
    : `Updated: ${activeItems.length} items active.`;
}

// Event listeners
interactiveElements.forEach(el => {
  el.addEventListener('click', () => {
    const id = parseInt(el.dataset.id);
    if (state.has(id)) {
      state.delete(id);
      el.classList.remove('selected');
    } else {
      state.add(id);
      el.classList.add('selected');
    }
    updateDiagram();
  });
});
```

#### Three.js Scene Pattern (main.js)
```javascript
function initScene() {
  const container = document.getElementById('canvasContainer');
  if (!container) return;
  
  // Setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 6;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  
  // Objects
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x4F46E5 });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    sphere.rotation.y = time * 0.5;
    renderer.render(scene, camera);
  }
  animate();
  
  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initScene);
```

#### style.css Pattern
```css
/* Only include styles that Tailwind cannot handle:
   - Custom animations and keyframes
   - Complex pseudo-element styles
   - JS-toggled state classes
*/

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Navbar scroll state (toggled by JS) */
#navbar.scrolled {
  background-color: rgba(249, 248, 244, 0.9);
  backdrop-filter: blur(12px);
}

/* Interactive element states (toggled by JS) */
.interactive-item.active {
  background-color: #3B82F6;
  transform: scale(1.1);
}

.interactive-item.selected {
  background-color: #292524;
  border-color: #1C1917;
}
```

### Interactive Component Patterns

Example interactive patterns to implement:

1. **Click-to-toggle states** — Elements that change appearance on click
   ```html
   <button class="data-qubit" data-id="0"></button>
   ```

2. **Animated step-by-step processes** — Auto-cycling through stages
   ```javascript
   setInterval(() => {
     currentStep = (currentStep + 1) % totalSteps;
     updateVisualization(currentStep);
   }, 2000);
   ```

3. **Comparative bar charts** — With selectable parameters
   ```html
   <button class="dist-btn active" data-distance="3">Option A</button>
   <button class="dist-btn" data-distance="5">Option B</button>
   ```

4. **Sliders** — To adjust simulation parameters
   ```html
   <input type="range" min="0" max="100" value="50" id="paramSlider">
   ```

5. **Hover states** — That reveal additional information
   ```css
   .card:hover .hidden-info { opacity: 1; }
   ```

### Important Notes

- **Use Tailwind classes** for all layout, spacing, colors, and typography
- **Keep style.css minimal** — only animations, keyframes, and JS-toggled states
- **All JavaScript in main.js** — no inline scripts except Tailwind config
- **Use semantic HTML** — proper heading hierarchy, accessible buttons
- **Include data attributes** — for JS to reference (`data-id`, `data-step`, etc.)
- **Mobile-first responsive** — use Tailwind's responsive prefixes (`md:`, `lg:`)
- **Attribute the original paper** in the footer

### Example Transformation

**Input**: A research paper about neural network optimization  
**Output**: An explorable page with:
- Hero with animated neural network Three.js visualization
- Interactive diagram showing gradient flow (click nodes to highlight paths)
- Slider to adjust learning rate and see convergence behavior in real-time
- Comparative bar chart of optimization methods (click buttons to switch data)
- Step-by-step animation of backpropagation process

Generate content that helps readers **understand and explore** the research, not just read about it.


