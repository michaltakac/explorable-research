# AI Agent Instructions

You are an AI agent generating code inside an E2B sandbox environment. Your task is to create **explorable research visualizations** — interactive web pages that transform research articles into engaging, educational experiences using pure HTML, CSS, and JavaScript.

## Environment

- **Runtime**: Node.js 24 (for http-server only)
- **Framework**: None — vanilla HTML/CSS/JS
- **Styling**: TailwindCSS v4 (via CDN)
- **3D Graphics**: Three.js r128 (via CDN)
- **Working Directory**: `/home/user`
- **Server**: `npx http-server . -p 3000` (auto-started)

## File Structure

```
/home/user/
├── AGENTS.md     # This file (read-only reference)
├── README.md     # Template documentation
├── index.html    # ⭐ Main HTML file - PRIMARY EDIT TARGET
├── style.css     # ⭐ Custom CSS for animations/states
└── main.js       # ⭐ JavaScript for interactivity and Three.js
```

**All three files are editable.** No build step — changes are live immediately.

## Available Libraries (CDN)

Already loaded in `index.html`:

```html
<!-- TailwindCSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:...&family=Inter:...">
```

## Your Task

1. **Read** the research article/paper provided by the user
2. **Identify** key concepts that can be visualized interactively
3. **Generate** HTML structure with Tailwind classes in `index.html`
4. **Generate** JavaScript interactions in `main.js`
5. **Generate** custom CSS animations/states in `style.css`

## Code Generation Rules

### DO ✅
- Use TailwindCSS utility classes for all layout and styling
- Keep custom CSS minimal — only animations and JS-toggled states
- Use vanilla JavaScript (ES6+) for all interactivity
- Use Three.js for 3D visualizations
- Use `data-*` attributes for JS element selection
- Use semantic HTML elements
- Make it mobile-responsive with Tailwind prefixes (`md:`, `lg:`)

### DO NOT ❌
- Use any frameworks (React, Vue, etc.)
- Use npm packages or build tools
- Use inline `<style>` blocks (put in `style.css`)
- Use inline `onclick` handlers (use `addEventListener` in `main.js`)
- Create additional files

## Tailwind Configuration

Already set up in `index.html`:

```javascript
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
```

## Design System

### Colors
- **Background**: `bg-cream` (#F9F8F4)
- **Light sections**: `bg-cream-light` (#F5F4F0), `bg-white`
- **Dark sections**: `bg-stone-900`
- **Accent**: `text-nobel-gold`, `bg-nobel-gold`, `border-nobel-gold`
- **Text**: `text-stone-800` (primary), `text-stone-600`, `text-stone-400`

### Typography
- **Headings**: `font-serif` (Playfair Display)
- **Body**: `font-sans` (Inter) — default on body
- **Hero title**: `text-5xl md:text-7xl lg:text-8xl font-serif`
- **Section title**: `text-4xl md:text-5xl font-serif`

## HTML Structure Pattern

```html
<body class="font-sans bg-cream text-stone-800 antialiased">
  <!-- 1. Navigation -->
  <nav id="navbar" class="fixed top-0 left-0 right-0 z-50 py-6 transition-all">
    <!-- nav content -->
  </nav>

  <!-- 2. Mobile Menu -->
  <div id="mobileMenu" class="hidden fixed inset-0 z-40 bg-cream">
    <!-- menu links -->
  </div>

  <!-- 3. Hero Section -->
  <header id="hero" class="relative h-screen flex items-center justify-center">
    <div id="heroCanvas" class="absolute inset-0 z-0 opacity-60"></div>
    <!-- hero content -->
  </header>

  <main>
    <!-- 4. Content Sections -->
    <section id="introduction" class="py-24 bg-white">...</section>
    <section id="science" class="py-24 bg-white border-t">...</section>
    <section class="py-24 bg-stone-900 text-stone-100">...</section>
    <section class="py-24 bg-cream">...</section>
    <section id="impact" class="py-24 bg-white">...</section>
    <section id="authors" class="py-24 bg-cream-light">...</section>
  </main>

  <!-- 5. Footer -->
  <footer class="bg-stone-900 text-stone-400 py-16">...</footer>

  <!-- Scripts at end of body -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="main.js"></script>
</body>
```

## JavaScript Pattern (main.js)

```javascript
// ============================================
// NAVIGATION
// ============================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      const offset = 100;
      const position = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  });
});

// ============================================
// INTERACTIVE DIAGRAM
// ============================================
const container = document.getElementById('diagramContainer');
const elements = container.querySelectorAll('.interactive-element');
const statusText = document.getElementById('statusText');

let activeSet = new Set();

function updateDiagram() {
  elements.forEach(el => {
    const id = parseInt(el.dataset.id);
    el.classList.toggle('active', activeSet.has(id));
  });
  statusText.textContent = activeSet.size === 0 
    ? 'System is stable.' 
    : `${activeSet.size} items selected.`;
}

elements.forEach(el => {
  el.addEventListener('click', () => {
    const id = parseInt(el.dataset.id);
    activeSet.has(id) ? activeSet.delete(id) : activeSet.add(id);
    el.classList.toggle('selected');
    updateDiagram();
  });
});

// ============================================
// THREE.JS SCENE
// ============================================
function initScene() {
  const container = document.getElementById('heroCanvas');
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45, container.clientWidth / container.clientHeight, 0.1, 1000
  );
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
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0x4F46E5, metalness: 0.5 })
  );
  scene.add(sphere);

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    sphere.rotation.y = time * 0.5;
    sphere.position.y = Math.sin(time * 2) * 0.2;
    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

document.addEventListener('DOMContentLoaded', initScene);
```

## CSS Pattern (style.css)

```css
/* Only include styles that Tailwind cannot handle */

/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fade-in { animation: fadeIn 0.2s ease; }

/* Navbar scroll state (JS toggles .scrolled) */
#navbar.scrolled {
  background-color: rgba(249, 248, 244, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding-top: 1rem;
  padding-bottom: 1rem;
}

/* Interactive element states (JS toggles .active, .selected) */
.interactive-element {
  transition: all 0.3s ease;
}

.interactive-element.active {
  background-color: #3B82F6;
  transform: scale(1.1);
}

.interactive-element.selected {
  background-color: #292524;
}

/* Button active state */
.dist-btn.active {
  background-color: #C5A059;
  border-color: #C5A059;
  color: #1C1917;
}
```

## Example Output

For a paper about "Quantum Error Correction with Machine Learning":

**index.html**:
- Navigation with smooth scroll links
- Hero with title "AlphaQubit" and Three.js canvas background
- Introduction section with drop cap styling
- Interactive surface code diagram with clickable qubits
- Architecture animation with auto-cycling steps
- Performance bar chart with distance selector buttons
- Impact section with 3D quantum computer visualization
- Author cards grid
- Footer with DOI link

**main.js**:
- Navbar scroll handler
- Mobile menu toggle
- Surface code click handlers with parity calculation
- Architecture step animation with `setInterval`
- Chart update function with button listeners
- Two Three.js scenes (hero + quantum computer)

**style.css**:
- Navbar `.scrolled` state
- Diagram `.active` and `.selected` states
- Button `.active` state
- Custom keyframe animations

## Debugging

- Changes are live — just refresh the browser
- Check browser console (F12) for JavaScript errors
- Use browser DevTools to inspect element classes
- If Three.js scene doesn't appear, check container dimensions


