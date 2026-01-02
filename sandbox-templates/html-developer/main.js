/**
 * AlphaQubit - Interactive Explorable Research
 * Plain HTML/CSS/JS with Three.js
 */

// ============================================
// NAVIGATION
// ============================================
const navbar = document.getElementById('navbar');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = menuToggle.querySelector('.menu-icon');
const closeIcon = menuToggle.querySelector('.close-icon');

// Scroll handler for navbar
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  menuIcon.classList.toggle('hidden');
  closeIcon.classList.toggle('hidden');
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-link, .nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      mobileMenu.classList.add('hidden');
      menuIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
      
      const target = document.querySelector(href);
      if (target) {
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  });
});

// ============================================
// SURFACE CODE INTERACTIVE DIAGRAM
// ============================================
const surfaceCodeGrid = document.getElementById('surfaceCodeGrid');
const diagramStatus = document.getElementById('diagramStatus');
const dataQubits = surfaceCodeGrid.querySelectorAll('.data-qubit');
const stabilizers = surfaceCodeGrid.querySelectorAll('.stabilizer');

// Adjacency: which stabilizers are affected by which data qubits
const adjacency = {
  0: [0, 1],
  1: [0, 2],
  2: [1, 3],
  3: [2, 3],
  4: [0, 1, 2, 3]
};

let errors = new Set();

function updateStabilizers() {
  const activeStabilizers = [0, 1, 2, 3].filter(stabId => {
    let errorCount = 0;
    Object.entries(adjacency).forEach(([dataId, stabs]) => {
      if (errors.has(parseInt(dataId)) && stabs.includes(stabId)) {
        errorCount++;
      }
    });
    return errorCount % 2 !== 0;
  });
  
  stabilizers.forEach(stab => {
    const id = parseInt(stab.dataset.id);
    if (activeStabilizers.includes(id)) {
      stab.classList.add('active');
    } else {
      stab.classList.remove('active');
    }
  });
  
  if (errors.size === 0) {
    diagramStatus.textContent = 'System is stable.';
  } else {
    diagramStatus.textContent = `Detected ${activeStabilizers.length} parity violations.`;
  }
}

dataQubits.forEach(qubit => {
  qubit.addEventListener('click', () => {
    const id = parseInt(qubit.dataset.id);
    if (errors.has(id)) {
      errors.delete(id);
      qubit.classList.remove('error');
    } else {
      errors.add(id);
      qubit.classList.add('error');
    }
    updateStabilizers();
  });
});

// ============================================
// TRANSFORMER ARCHITECTURE ANIMATION
// ============================================
const inputStage = document.getElementById('inputStage');
const transformerStage = document.getElementById('transformerStage');
const outputStage = document.getElementById('outputStage');
const outputSymbol = document.getElementById('outputSymbol');
const arrow1 = document.getElementById('arrow1');
const arrow2 = document.getElementById('arrow2');
const progressDots = document.querySelectorAll('.progress-dot');
const syndromeCells = document.querySelectorAll('.syndrome-cell');

let currentStep = 0;

function updateArchitecture(step) {
  // Reset all states
  inputStage.classList.remove('active');
  transformerStage.classList.remove('active', 'processing');
  outputStage.classList.remove('success');
  arrow1.classList.remove('active');
  arrow2.classList.remove('active');
  outputSymbol.textContent = '?';
  
  progressDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === step);
  });
  
  // Randomize syndrome cells
  syndromeCells.forEach(cell => {
    cell.classList.toggle('active', Math.random() > 0.7);
  });
  
  switch(step) {
    case 0:
      inputStage.classList.add('active');
      break;
    case 1:
      arrow1.classList.add('active');
      transformerStage.classList.add('active', 'processing');
      break;
    case 2:
      transformerStage.classList.add('active');
      break;
    case 3:
      arrow2.classList.add('active');
      outputStage.classList.add('success');
      outputSymbol.textContent = 'X';
      break;
  }
}

setInterval(() => {
  currentStep = (currentStep + 1) % 4;
  updateArchitecture(currentStep);
}, 2000);

// Initial state
updateArchitecture(0);

// ============================================
// PERFORMANCE CHART
// ============================================
const distanceButtons = document.querySelectorAll('.dist-btn');
const mwpmBar = document.getElementById('mwpmBar');
const alphaBar = document.getElementById('alphaBar');
const mwpmValue = document.getElementById('mwpmValue');
const alphaValue = document.getElementById('alphaValue');

const performanceData = {
  3: { mwpm: 3.5, alpha: 2.9 },
  5: { mwpm: 3.6, alpha: 2.75 },
  11: { mwpm: 0.0041, alpha: 0.0009 }
};

let currentDistance = 5;

function formatValue(val) {
  if (val < 0.01) return val.toFixed(4) + '%';
  return val.toFixed(2) + '%';
}

function updateChart(distance) {
  currentDistance = distance;
  const data = performanceData[distance];
  const maxVal = Math.max(data.mwpm, data.alpha) * 1.25;
  
  // Update button states
  distanceButtons.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.distance) === distance);
  });
  
  // Update bars
  const mwpmHeight = (data.mwpm / maxVal) * 100;
  const alphaHeight = Math.max(1, (data.alpha / maxVal) * 100);
  
  mwpmBar.style.height = mwpmHeight + '%';
  alphaBar.style.height = alphaHeight + '%';
  
  mwpmValue.textContent = formatValue(data.mwpm);
  alphaValue.textContent = formatValue(data.alpha);
}

distanceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    updateChart(parseInt(btn.dataset.distance));
  });
});

// Initial chart state
updateChart(5);

// ============================================
// THREE.JS SCENES
// ============================================

// Hero Scene
function initHeroScene() {
  const container = document.getElementById('heroCanvas');
  if (!container) return;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 6;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);
  
  // Main quantum particle (center sphere)
  const mainGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const mainMaterial = new THREE.MeshStandardMaterial({
    color: 0x4F46E5,
    metalness: 0.5,
    roughness: 0.2,
    envMapIntensity: 1
  });
  const mainSphere = new THREE.Mesh(mainGeometry, mainMaterial);
  scene.add(mainSphere);
  
  // Torus ring
  const torusGeometry = new THREE.TorusGeometry(3, 0.1, 16, 100);
  const torusMaterial = new THREE.MeshStandardMaterial({
    color: 0xC5A059,
    emissive: 0xC5A059,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
    wireframe: true
  });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.rotation.x = Math.PI / 2;
  scene.add(torus);
  
  // Smaller particles
  const smallGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  
  const purpleMaterial = new THREE.MeshStandardMaterial({
    color: 0x9333EA,
    metalness: 0.5,
    roughness: 0.2
  });
  const purpleSphere = new THREE.Mesh(smallGeometry, purpleMaterial);
  purpleSphere.position.set(-3, 1, -2);
  purpleSphere.scale.setScalar(0.5);
  scene.add(purpleSphere);
  
  const goldGeometry = new THREE.SphereGeometry(0.6, 32, 32);
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xC5A059,
    metalness: 0.5,
    roughness: 0.2
  });
  const goldSphere = new THREE.Mesh(goldGeometry, goldMaterial);
  goldSphere.position.set(3, -1, -3);
  goldSphere.scale.setScalar(0.6);
  scene.add(goldSphere);
  
  // Stars (simple particles)
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 500;
  const positions = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 50 - 25;
  }
  
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.6
  });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
  
  // Float animation variables
  let floatOffset = 0;
  
  // Animation
  function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    floatOffset = Math.sin(time) * 0.1;
    
    // Main sphere animation
    mainSphere.position.y = Math.sin(time * 2) * 0.2;
    mainSphere.rotation.x = time * 0.5;
    mainSphere.rotation.z = time * 0.3;
    
    // Float effect on torus
    torus.rotation.x = Math.PI / 2 + Math.sin(time * 0.2) * 0.2;
    torus.rotation.z = time * 0.1;
    
    // Small particles
    purpleSphere.position.y = 1 + Math.sin(time * 2 - 3) * 0.2;
    purpleSphere.rotation.x = time * 0.5;
    
    goldSphere.position.y = -1 + Math.sin(time * 2 + 3) * 0.2;
    goldSphere.rotation.z = time * 0.3;
    
    // Group float
    mainSphere.position.y += floatOffset;
    torus.position.y = floatOffset;
    
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

// Quantum Computer Scene
function initQuantumComputerScene() {
  const container = document.getElementById('quantumCanvas');
  if (!container) return;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 4.5;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  
  const spotLight = new THREE.SpotLight(0xC5A059, 2);
  spotLight.position.set(5, 5, 5);
  spotLight.angle = 0.3;
  spotLight.penumbra = 1;
  scene.add(spotLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(-5, -5, -5);
  scene.add(pointLight);
  
  // Create a group for the quantum computer
  const group = new THREE.Group();
  group.position.y = 0.5;
  scene.add(group);
  
  // Gold material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xC5A059,
    metalness: 1,
    roughness: 0.15
  });
  
  // Silver material
  const silverMaterial = new THREE.MeshStandardMaterial({
    color: 0xD1D5DB,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Copper material
  const copperMaterial = new THREE.MeshStandardMaterial({
    color: 0xB87333,
    metalness: 0.8,
    roughness: 0.3
  });
  
  // Dark material for chip
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.9,
    roughness: 0.1
  });
  
  // Top Plate
  const topPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 0.1, 64),
    goldMaterial
  );
  topPlate.position.y = 1;
  group.add(topPlate);
  
  // Middle Stage
  const middleStage = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.1, 64),
    goldMaterial
  );
  middleStage.position.y = 0.2;
  group.add(middleStage);
  
  // Bottom Stage (Mixing Chamber)
  const bottomStage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.1, 64),
    goldMaterial
  );
  bottomStage.position.y = -0.6;
  group.add(bottomStage);
  
  // Connecting Rods
  const rodGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
  
  const rod1 = new THREE.Mesh(rodGeometry, silverMaterial);
  rod1.position.set(0.5, 0.6, 0);
  group.add(rod1);
  
  const rod2 = new THREE.Mesh(rodGeometry, silverMaterial);
  rod2.position.set(-0.5, 0.6, 0);
  group.add(rod2);
  
  const rod3 = new THREE.Mesh(rodGeometry, silverMaterial);
  rod3.position.set(0, 0.6, 0.5);
  group.add(rod3);
  
  const rod4 = new THREE.Mesh(rodGeometry, silverMaterial);
  rod4.position.set(0, 0.6, -0.5);
  group.add(rod4);
  
  // Lower Rods
  const lowerRodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 16);
  
  const lowerRod1 = new THREE.Mesh(lowerRodGeometry, silverMaterial);
  lowerRod1.position.set(0.2, -0.2, 0);
  group.add(lowerRod1);
  
  const lowerRod2 = new THREE.Mesh(lowerRodGeometry, silverMaterial);
  lowerRod2.position.set(-0.2, -0.2, 0);
  group.add(lowerRod2);
  
  // Coils/Wires
  const coil1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.015, 16, 64),
    copperMaterial
  );
  coil1.rotation.x = Math.PI / 2;
  coil1.position.y = -0.2;
  group.add(coil1);
  
  const coil2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.015, 16, 64),
    copperMaterial
  );
  coil2.rotation.x = Math.PI / 2;
  coil2.position.y = -1;
  group.add(coil2);
  
  // Central processor chip
  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.05, 0.2),
    darkMaterial
  );
  chip.position.y = -0.7;
  group.add(chip);
  
  // Float animation variables
  let floatTime = 0;
  
  // Animation
  function animate() {
    requestAnimationFrame(animate);
    
    floatTime += 0.01;
    
    // Float effect
    group.position.y = 0.5 + Math.sin(floatTime) * 0.05;
    group.rotation.y = Math.sin(floatTime * 0.5) * 0.1;
    
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

// Initialize scenes when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initHeroScene();
  initQuantumComputerScene();
});

// Also initialize on window load (for safety)
window.addEventListener('load', () => {
  // Re-trigger resize to ensure proper sizing
  window.dispatchEvent(new Event('resize'));
});

