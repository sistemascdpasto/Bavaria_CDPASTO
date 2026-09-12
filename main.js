import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;
/* Modo de ubicación de pop-ups: ver bloque PLACEMENT_IDS más abajo. */
const PLACEMENT_MODE = new URLSearchParams(location.search).get('colocar') === '1';

/* ---------- NAV SCROLL STATE ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- MOTION SYSTEM (GSAP + ScrollTrigger) ---------- */
const timelineEl = document.getElementById('timeline');
const tlFill = timelineEl ? timelineEl.querySelector('.timeline-svg .fill') : null;

if (prefersReducedMotion) {
  /* Static fallback: everything visible, no motion libs engaged */
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    el.style.opacity = 1;
    el.style.transform = 'none';
  });
  document.querySelectorAll('[data-tl]').forEach((el) => el.classList.add('is-visible'));
  if (tlFill) tlFill.style.strokeDashoffset = 0;
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
} else {
  gsap.registerPlugin(ScrollTrigger);

  /* Scroll reveal, replaces the old IntersectionObserver system */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    const type = el.dataset.reveal;
    const from = { opacity: 0 };
    if (type === 'up') from.y = 36;
    if (type === 'left') from.x = -36;
    if (type === 'right') from.x = 36;
    if (type === 'scale') from.scale = 0.94;
    const group = el.closest('[data-reveal-group]');
    const i = group ? parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0 : 0;
    gsap.fromTo(el, from, {
      opacity: 1, x: 0, y: 0, scale: 1,
      duration: 0.9,
      delay: i * 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Timeline: draw the spine as the section scrolls, mark items as they arrive */
  if (tlFill) {
    gsap.to(tlFill, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: timelineEl, start: 'top 75%', end: 'bottom 65%', scrub: 0.6 },
    });
  }
  document.querySelectorAll('[data-tl]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => el.classList.add('is-visible'),
    });
  });

  /* Count-up stats */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(el, { textContent: target, duration: 1.3, ease: 'power3.out', snap: { textContent: 1 } }),
    });
  });

  /* Hero parallax on scroll-out */
  gsap.to('.hero-glow', { y: 130, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-glow-2', { y: -100, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-top', { y: 70, opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------- RISING BUBBLES ---------- */
const bubbleContainer = document.getElementById('bubbles');
if (bubbleContainer && !prefersReducedMotion) {
  const count = window.innerWidth < 720 ? 10 : 18;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('span');
    b.className = 'bubble';
    const size = 4 + Math.random() * 14;
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    const duration = 9 + Math.random() * 10;
    b.style.animationDuration = duration + 's';
    b.style.animationDelay = (Math.random() * duration) + 's';
    bubbleContainer.appendChild(b);
  }
}

/* ---------- HERO PARALLAX (mouse-driven rack grid + glow) ---------- */
const heroRack = document.getElementById('hero-rack');
const cursorGlow = document.getElementById('cursor-glow');
if (isFinePointer && !prefersReducedMotion) {
  gsap.set(cursorGlow, { x: -9999, y: -9999 });
  const glowX = gsap.quickTo(cursorGlow, 'x', { duration: 0.5, ease: 'power3' });
  const glowY = gsap.quickTo(cursorGlow, 'y', { duration: 0.5, ease: 'power3' });
  const rackX = heroRack ? gsap.quickTo(heroRack, 'x', { duration: 0.6, ease: 'power3' }) : null;
  const rackY = heroRack ? gsap.quickTo(heroRack, 'y', { duration: 0.6, ease: 'power3' }) : null;
  window.addEventListener('pointermove', (e) => {
    const cx = e.clientX, cy = e.clientY;
    glowX(cx - 260);
    glowY(cy - 260);
    if (heroRack && cy < window.innerHeight) {
      rackX((cx / window.innerWidth - 0.5) * 18);
      rackY((cy / window.innerHeight - 0.5) * 18);
    }
  }, { passive: true });
}

/* ---------- MAGNETIC PRIMARY BUTTONS ---------- */
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.btn').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.18);
      yTo((e.clientY - r.top - r.height / 2) * 0.28);
    });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- TILT ON BRAND PLATES ---------- */
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.tilt').forEach((plate) => {
    const rotX = gsap.quickTo(plate, 'rotationX', { duration: 0.5, ease: 'power3' });
    const rotY = gsap.quickTo(plate, 'rotationY', { duration: 0.5, ease: 'power3' });
    const scaleTo = gsap.quickTo(plate, 'scale', { duration: 0.5, ease: 'power3' });
    plate.addEventListener('pointermove', (e) => {
      const r = plate.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotX(-py * 14);
      rotY(px * 14);
      scaleTo(1.04);
    });
    plate.addEventListener('pointerleave', () => { rotX(0); rotY(0); scaleTo(1); });
  });
}

/* ---------- 3D VIEWER ---------- */
const frame = document.querySelector('.viewer-frame');
const canvas = document.getElementById('viewer-canvas');
const loadingEl = document.getElementById('viewer-loading');
const loadingFill = document.getElementById('loading-fill');
const loadingText = document.getElementById('loading-text');
const hintEl = document.getElementById('viewer-hint');
const hotspotsLayer = document.getElementById('hotspots');
const hotspotModal = document.getElementById('hotspot-modal');
const hotspotModalImg = document.getElementById('hotspot-modal-img');
const hotspotModalTitle = document.getElementById('hotspot-modal-title');
const hotspotModalCaption = document.getElementById('hotspot-modal-caption');
const hotspotModalNav = document.getElementById('hotspot-modal-nav');
const hotspotModalPrev = document.getElementById('hotspot-modal-prev');
const hotspotModalNext = document.getElementById('hotspot-modal-next');
const hotspotModalCounter = document.getElementById('hotspot-modal-counter');
const hotspotModalIcon = document.getElementById('hotspot-modal-icon');

/* Señalización de seguridad: catálogo de tipos y su información. */
const SAFETY_CATEGORIES = {
  encuentro: {
    label: 'Punto de encuentro',
    color: 'var(--green)',
    info: 'Punto de encuentro asignado para la brigada de emergencias. En caso de alarma o evacuación, diríjase aquí de forma calmada y espere instrucciones del personal de brigada.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 5v3M12 16v3M5 12h3M16 12h3"/><circle cx="12" cy="12" r="2"/></svg>',
  },
  extintor: {
    label: 'Extintor',
    color: 'var(--red)',
    info: 'Extintor de incendios. Verifique periódicamente su carga y fecha de vencimiento. Debe ser operado únicamente por personal capacitado.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h3"/><path d="M11.5 3v2.5"/><rect x="8" y="6.5" width="8" height="13" rx="2.5"/><path d="M8 10H5.5L4 12"/><path d="M16 9l3-2"/></svg>',
  },
  botiquin: {
    label: 'Botiquín',
    color: 'var(--blue)',
    info: 'Botiquín de primeros auxilios. Contiene elementos básicos para la atención inicial de heridas y emergencias médicas menores. Reporte su uso para reposición inmediata.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M12 9v6M9 12h6"/></svg>',
  },
  'red-incendio': {
    label: 'Red contra incendio',
    color: 'var(--red)',
    info: 'Punto de la red contra incendios del CD (gabinete / hidrante). Uso exclusivo de la brigada de emergencias y del cuerpo de bomberos.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M10 21v-3h4v3"/><rect x="8.5" y="6" width="7" height="12" rx="2"/><path d="M6 9h2.5M15.5 9H18"/><path d="M9.5 3h5"/></svg>',
  },
  evacuacion: {
    label: 'Zona de evacuación',
    color: 'var(--gold)',
    info: 'Ruta y zona de evacuación señalizada. Siga esta dirección en caso de emergencia hasta llegar al punto de encuentro más cercano.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="4.5" r="1.5"/><path d="M9 6.5l-2 4 2 1.5-1 6"/><path d="M9 8.5l3 1 2-2"/><path d="M9 10l-3 2"/><path d="M15 15h6M18 12l3 3-3 3"/></svg>',
  },
  peligro: {
    label: 'Peligro',
    color: '#e0611a',
    info: 'Zona de peligro con riesgos identificados. Manténgase alerta, use los elementos de protección personal requeridos y siga la señalización del sector.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l9.5 16.5H2.5L12 3.5z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
  },
};

/* Posiciones definitivas de la señalización de seguridad sobre el modelo. */
const SAFETY_PIN_DEFAULTS = [
  { type: 'encuentro', position: [-81.22, 0.07, -42.43] },
  { type: 'encuentro', position: [25.07, 0.06, 65.90] },
  { type: 'extintor', position: [-64.51, 0.00, 4.87] },
  { type: 'red-incendio', position: [-74.44, 0.06, -71.02] },
  { type: 'extintor', position: [-72.47, 0.06, 67.97] },
  { type: 'extintor', position: [-44.42, 0.00, 5.28] },
  { type: 'extintor', position: [30.43, 0.00, 3.93] },
  { type: 'extintor', position: [-42.43, 10.55, -15.15] },
  { type: 'extintor', position: [68.43, 0.00, 1.71] },
  { type: 'extintor', position: [61.70, 10.32, -12.11] },
  { type: 'extintor', position: [78.97, 0.00, 34.09] },
  { type: 'extintor', position: [-90.63, 0.39, 7.50] },
  { type: 'botiquin', position: [-50.51, 0.06, 63.79] },
  { type: 'botiquin', position: [-79.59, 1.59, 7.75] },
  { type: 'evacuacion', position: [-62.73, 0.00, 36.21] },
  { type: 'peligro', position: [-36.55, 0.00, 36.36] },
  { type: 'peligro', position: [-8.84, 0.00, 37.58] },
  { type: 'peligro', position: [28.22, 0.00, 37.62] },
];

/* Puntos de interés sobre el modelo — posiciones fijas calculadas a partir
   de la geometría real de las piezas del GLB. */
const HOTSPOTS = [
  {
    id: 'carpa',
    title: 'Carpa',
    images: ['assets/carpa.jpeg'],
    caption: 'Carpa del patio del Centro de Distribución Nariño.',
    position: [97.79, 4.63, -36.36],
  },
  {
    id: 'oficinas',
    title: 'Oficinas administrativas',
    images: ['assets/oficina-1.jpeg', 'assets/oficina-2.jpeg', 'assets/oficina-3.jpeg', 'assets/oficina-4.jpeg', 'assets/oficina-5.jpeg', 'assets/oficina-6.jpeg', 'assets/oficina-7.jpeg', 'assets/oficina-8.jpeg', 'assets/oficina-9.jpeg', 'assets/oficina-10.jpeg'],
    caption: 'Oficinas administrativas del Centro de Distribución Nariño.',
    position: [-87.49, 7.00, -9.37],
  },
  {
    id: 'sustancias-quimicas',
    title: 'Cuarto de sustancias químicas',
    images: ['assets/cuarto-de-sustancias-quimicas.jpeg'],
    caption: 'Almacenamiento controlado de sustancias químicas.',
    position: [-63.36, 5.40, -11.36],
  },
  {
    id: 'picking',
    title: 'Picking',
    images: ['assets/picking-1.jpg', 'assets/picking-2.jpg', 'assets/picking-3.jpeg'],
    caption: 'Zona de picking y alistamiento de pedidos.',
    position: [41.36, 9.79, -5.03],
  },
  {
    id: 'taller-montacargas',
    title: 'Taller de montacargas',
    images: ['assets/taller-montacargas.jpeg'],
    caption: 'Taller y parqueo de montacargas.',
    position: [-50.15, 4.10, 57.27],
  },
  {
    id: 'bahia-cargue',
    title: 'Bahía de cargue y descargue',
    images: ['assets/bahia-cargue-descargue.jpg'],
    caption: 'Bahías de cargue y descargue de camiones.',
    position: [6.86, 5.45, 12.31],
  },
  {
    id: 'cuarto-bajas',
    title: 'Zona de vertimiento y cuarto de baja',
    images: ['assets/cuarto-de-bajas.jpeg', 'assets/zona-vertimiento-cuarto-de-bajas.jpeg'],
    caption: 'Zona de vertimiento y cuarto de producto dado de baja.',
    position: [-42.96, 0.00, 56.49],
  },
  {
    id: 'centro-acopio',
    title: 'Centro de acopio',
    images: ['assets/centro-de-acopio.jpeg'],
    caption: 'Centro de acopio del patio oriental.',
    position: [-38.68, 0.08, 61.47],
  },
  {
    id: 'reempaque',
    title: 'Reempaque',
    images: ['assets/reempaque-1.jpg', 'assets/reempaque-2.jpeg', 'assets/reempaque-3.jpeg', 'assets/reempaque-4.jpg', 'assets/reempaque-5.jpeg', 'assets/reempaque-6.jpeg'],
    caption: 'Zona de reempaque de producto.',
    position: [-60.97, 4.10, 57.26],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    images: ['assets/sorting-1.jpg', 'assets/sorting-2.jpg'],
    caption: 'Zona de sorting y clasificación.',
    position: [94.49, 0.00, 51.49],
  },
  /* Puntos de interés nuevos — sin ubicar todavía. Se colocan a mano
     con el modo de ubicación (ver PLACEMENT_MODE más abajo) y luego
     se reemplaza el position [0,0,0] por las coordenadas definitivas. */
  {
    id: 'marketplace',
    title: 'Marketplace',
    images: ['assets/marketplace-1.jpeg', 'assets/marketplace-2.jpeg'],
    caption: 'Marketplace del Centro de Distribución Nariño.',
    position: [40.01, 11.03, -33.47],
  },
  {
    id: 'parqueadero-t2',
    title: 'Parqueadero T2',
    images: ['assets/parqueadero-t2-1.jpeg', 'assets/parqueadero-t2-2.jpeg', 'assets/parqueadero-t2-3.jpeg'],
    caption: 'Parqueadero T2.',
    position: [9.94, 0.09, 51.82],
  },
  {
    id: 'sendero-parqueadero-t2',
    title: 'Sendero Parqueadero T2',
    images: ['assets/sendero-parqueadero-t2-1.jpeg', 'assets/sendero-parqueadero-t2-2.jpeg', 'assets/sendero-parqueadero-t2-3.jpeg'],
    caption: 'Sendero de acceso al parqueadero T2.',
    position: [-25.00, 0.00, 46.12],
  },
  {
    id: 'sendero-taller-montacargas',
    title: 'Sendero taller montacargas',
    images: ['assets/sendero-taller-montacargas.jpeg'],
    caption: 'Sendero hacia el taller de montacargas.',
    position: [-46.50, 0.00, 48.51],
  },
  {
    id: 'sendero-entrada',
    title: 'Sendero entrada',
    images: ['assets/sendero-entrada-1.jpeg', 'assets/sendero-entrada-2.jpeg'],
    caption: 'Sendero de entrada al Centro de Distribución.',
    position: [-74.06, 0.08, 29.05],
  },
];

const scene = new THREE.Scene();
scene.background = null;
scene.fog = null;

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
camera.position.set(30, 24, 30);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

function sizeRenderer() {
  const w = frame.clientWidth, h = frame.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const hemi = new THREE.HemisphereLight(0x9db4c9, 0x2a2018, 0.65);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffd9a0, 2.1);
sun.position.set(40, 60, 20);
scene.add(sun);

const rim = new THREE.DirectionalLight(0xe2341c, 0.5);
rim.position.set(-30, 15, -25);
scene.add(rim);

const fillAmber = new THREE.PointLight(0xf0b429, 0.6, 120);
fillAmber.position.set(-15, 10, 15);
scene.add(fillAmber);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 160;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.1;
controls.target.set(0, 0, 0);

let modelRoot = null;
let activeHotspots = [];
let safetyPins = [];

function projectPinToScreen(entry) {
  const v = entry.position.clone().project(camera);
  const behind = v.z > 1 || v.z < -1;
  const w = frame.clientWidth, h = frame.clientHeight;
  entry.el.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
  entry.el.style.top = ((-v.y * 0.5 + 0.5) * h) + 'px';
  entry.el.style.display = behind ? 'none' : '';
}

function createSafetyPinInstance(type, position) {
  const cat = SAFETY_CATEGORIES[type];
  if (!cat) return null;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'safety-pin';
  el.style.setProperty('--accent', cat.color);
  el.setAttribute('aria-label', cat.label);
  el.innerHTML = '<span class="pulse"></span><span class="badge">' + cat.icon + '</span><span class="label">' + cat.label + '</span>';
  hotspotsLayer.appendChild(el);

  const entry = { type, el, position: new THREE.Vector3(...position) };
  el.addEventListener('click', () => openSafetyInfo(entry));
  safetyPins.push(entry);
  return entry;
}

function resolveSafetyPins() {
  if (!hotspotsLayer) return;
  SAFETY_PIN_DEFAULTS.forEach((p) => createSafetyPinInstance(p.type, p.position));
}

function resolveHotspots() {
  if (!hotspotsLayer) return;
  /* Los pop-ups nuevos sin ubicar (placed: false) quedan ocultos para
     visitantes normales; solo se muestran en modo de ubicación. */
  const visible = PLACEMENT_MODE ? HOTSPOTS : HOTSPOTS.filter((h) => h.placed !== false);
  activeHotspots = visible.map((h) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hotspot-pin';
    el.setAttribute('aria-label', 'Ver información: ' + h.title);
    el.innerHTML = '<span class="pulse"></span><span class="dot"></span><span class="label">' + h.title + '</span>';
    hotspotsLayer.appendChild(el);

    const entry = { ...h, el, position: new THREE.Vector3(...h.position) };
    el.addEventListener('click', () => openHotspot(entry));
    return entry;
  });
}

function updateHotspots() {
  activeHotspots.forEach(projectPinToScreen);
  safetyPins.forEach(projectPinToScreen);
}

let galleryImages = [];
let galleryIndex = 0;

function renderGalleryImage() {
  hotspotModalImg.src = galleryImages[galleryIndex];
  const multi = galleryImages.length > 1;
  hotspotModalNav.style.display = multi ? '' : 'none';
  hotspotModalCounter.textContent = multi ? (galleryIndex + 1) + ' / ' + galleryImages.length : '';
}
function openHotspot(h) {
  hotspotModalIcon.style.display = 'none';
  hotspotModalImg.style.display = '';
  galleryImages = h.images;
  galleryIndex = 0;
  hotspotModalImg.alt = h.title;
  hotspotModalTitle.textContent = h.title;
  hotspotModalCaption.textContent = h.caption || '';
  renderGalleryImage();
  hotspotModal.classList.add('is-open');
  hotspotModal.setAttribute('aria-hidden', 'false');
}
function openSafetyInfo(entry) {
  const cat = SAFETY_CATEGORIES[entry.type];
  if (!cat) return;
  hotspotModalImg.style.display = 'none';
  hotspotModalNav.style.display = 'none';
  hotspotModalIcon.style.display = 'flex';
  hotspotModalIcon.style.color = cat.color;
  hotspotModalIcon.innerHTML = cat.icon;
  hotspotModalTitle.textContent = cat.label;
  hotspotModalCaption.textContent = cat.info;
  hotspotModal.classList.add('is-open');
  hotspotModal.setAttribute('aria-hidden', 'false');
}
function closeHotspotModal() {
  hotspotModal.classList.remove('is-open');
  hotspotModal.setAttribute('aria-hidden', 'true');
}
function showPrevImage() {
  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  renderGalleryImage();
}
function showNextImage() {
  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  renderGalleryImage();
}
hotspotModal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeHotspotModal));
hotspotModalPrev.addEventListener('click', showPrevImage);
hotspotModalNext.addEventListener('click', showNextImage);
window.addEventListener('keydown', (e) => {
  if (!hotspotModal.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeHotspotModal();
  if (e.key === 'ArrowLeft') showPrevImage();
  if (e.key === 'ArrowRight') showNextImage();
});

function boxCenterSize(box) {
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return { center, size };
}

function findNode(root, name) {
  let found = null;
  root.traverse((o) => { if (!found && o.name === name) found = o; });
  return found;
}

function computeView(box, angle = { az: 0.9, el: 0.55 }, distanceScale = 1.35) {
  const { center, size } = boxCenterSize(box);
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 10;
  const dist = radius * distanceScale + radius;
  const az = angle.az, el = angle.el;
  const pos = new THREE.Vector3(
    center.x + dist * Math.cos(el) * Math.sin(az),
    center.y + dist * Math.sin(el) + radius * 0.15,
    center.z + dist * Math.cos(el) * Math.cos(az)
  );
  return { target: center.clone(), position: pos };
}

let views = {};

const loader = new GLTFLoader();
let modelLoadStarted = false;
function startModelLoad() {
  if (modelLoadStarted) return;
  modelLoadStarted = true;
  loader.load(
    'assets/layout-cd-narino.glb',
    (gltf) => {
      modelRoot = gltf.scene;

      modelRoot.traverse((o) => {
        if (o.isMesh) {
          o.frustumCulled = true;
          if (o.material) o.material.side = THREE.FrontSide;
        }
      });

      scene.add(modelRoot);

      const fullBox = new THREE.Box3().setFromObject(modelRoot);

      const terreno = findNode(modelRoot, 'terreno') || findNode(modelRoot, 'sitio');
      const bodegaA = findNode(modelRoot, 'cubierta_bodega');
      const bodegaB = findNode(modelRoot, 'almacenamiento_bodega');

      const patioBox = terreno ? new THREE.Box3().setFromObject(terreno) : fullBox;
      let bodegaBox = null;
      if (bodegaA || bodegaB) {
        bodegaBox = new THREE.Box3();
        if (bodegaA) bodegaBox.expandByObject(bodegaA);
        if (bodegaB) bodegaBox.expandByObject(bodegaB);
      } else {
        bodegaBox = fullBox;
      }

      views = {
        general: computeView(fullBox, { az: 0.78, el: 0.58 }, 2.05),
        patio: computeView(patioBox, { az: 1.35, el: 0.42 }, 1.3),
        bodega: computeView(bodegaBox, { az: 0.35, el: 0.5 }, 1.4),
      };

      applyView(views.general, true);
      resolveHotspots();
      resolveSafetyPins();

      loadingFill.style.width = '100%';
      setTimeout(() => loadingEl.classList.add('hidden'), 250);
    },
    (xhr) => {
      if (xhr.total) {
        const pct = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
        loadingFill.style.width = pct + '%';
        loadingText.textContent = 'Cargando modelo… ' + pct + '%';
      }
    },
    (err) => {
      loadingText.textContent = 'No se pudo cargar el modelo 3D.';
      console.error(err);
    }
  );
}

function applyView(view, instant = false) {
  if (!view) return;
  if (instant) {
    camera.position.copy(view.position);
    controls.target.copy(view.target);
    controls.update();
    return;
  }
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = view.position.clone();
  const endTarget = view.target.clone();
  const duration = 950;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPos, endPos, e);
    controls.target.lerpVectors(startTarget, endTarget, e);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const vButtons = document.querySelectorAll('.vctrl');
vButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.view;
    if (key === 'auto') {
      controls.autoRotate = !controls.autoRotate;
      btn.classList.toggle('active', controls.autoRotate);
      return;
    }
    vButtons.forEach((b) => { if (b.dataset.view !== 'auto') b.classList.remove('active'); });
    btn.classList.add('active');
    controls.autoRotate = false;
    document.querySelector('.vctrl[data-view="auto"]').classList.remove('active');
    if (views[key]) applyView(views[key]);
  });
});
document.querySelector('.vctrl[data-view="general"]').classList.add('active');

let hintHidden = false;
function hideHint() {
  if (hintHidden) return;
  hintHidden = true;
  hintEl.classList.add('hidden');
}
renderer.domElement.addEventListener('pointerdown', hideHint, { once: true });

const ro = new ResizeObserver(() => sizeRenderer());
ro.observe(frame);
sizeRenderer();

let rafId = null;
function animate() {
  rafId = requestAnimationFrame(animate);
  controls.update();
  updateHotspots();
  renderer.render(scene, camera);
}
function startRenderLoop() {
  if (rafId === null) animate();
}
function stopRenderLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/* Diferir la carga del modelo (5+MB) y el render loop hasta que el
   visor esté por entrar en pantalla, en vez de arrancar ambos de una
   vez al cargar la página. */
const viewerVisibilityObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startModelLoad();
        startRenderLoop();
      } else {
        stopRenderLoop();
      }
    });
  },
  { rootMargin: '600px 0px' }
);
viewerVisibilityObserver.observe(frame);

/* ---------- MODO DE UBICACIÓN (solo con ?colocar=1 en la URL) ----------
   Deja hacer clic sobre el modelo 3D para fijar la posición de los
   pop-ups nuevos que todavía no tienen coordenadas. Genera el código
   listo para pegar en HOTSPOTS. No aparece para los visitantes normales. */
const PLACEMENT_IDS = ['marketplace', 'parqueadero-t2', 'sendero-parqueadero-t2', 'sendero-taller-montacargas', 'sendero-entrada'];

if (PLACEMENT_MODE) {
  startModelLoad();
  startRenderLoop();

  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let placingId = null;
  let downPos = null;

  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9999;background:rgba(20,16,12,0.92);color:#fff;padding:14px;border-radius:10px;font:12px/1.4 monospace;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,0.4);';
  panel.innerHTML =
    '<div style="font-weight:bold;margin-bottom:8px;">Modo de ubicación</div>' +
    '<div id="placement-status" style="margin-bottom:8px;color:#ffd9a0;">Elige un punto y haz clic sobre el modelo.</div>' +
    '<div id="placement-list" style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;"></div>' +
    '<textarea id="placement-code" readonly style="width:100%;height:140px;background:#1a1512;color:#9fe0a0;border:1px solid #443;border-radius:6px;padding:6px;font:11px/1.4 monospace;"></textarea>' +
    '<button id="placement-copy" type="button" style="margin-top:6px;width:100%;padding:6px;border:0;border-radius:6px;background:#e2341c;color:#fff;font-weight:bold;cursor:pointer;">Copiar código</button>';
  document.body.appendChild(panel);

  const listEl = panel.querySelector('#placement-list');
  const statusEl = panel.querySelector('#placement-status');
  const codeEl = panel.querySelector('#placement-code');
  const buttons = {};

  PLACEMENT_IDS.forEach((id) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'text-align:left;padding:6px 8px;border-radius:6px;border:1px solid #554;background:#2a231c;color:#fff;cursor:pointer;';
    btn.addEventListener('click', () => {
      placingId = id;
      PLACEMENT_IDS.forEach((k) => { buttons[k].style.borderColor = k === id ? '#e2341c' : '#554'; });
      const h = HOTSPOTS.find((x) => x.id === id);
      statusEl.textContent = 'Haz clic en el modelo para ubicar: ' + h.title;
    });
    buttons[id] = btn;
    listEl.appendChild(btn);
  });

  function refreshPanel() {
    PLACEMENT_IDS.forEach((id) => {
      const h = HOTSPOTS.find((x) => x.id === id);
      buttons[id].textContent = (h.placed ? '✓ ' : '○ ') + h.title + (h.placed ? '  [' + h.position.map((n) => n.toFixed(2)).join(', ') + ']' : '');
    });
    const snippet = PLACEMENT_IDS.map((id) => {
      const h = HOTSPOTS.find((x) => x.id === id);
      return "  { id: '" + h.id + "', position: [" + h.position.map((n) => n.toFixed(2)).join(', ') + '] },';
    }).join('\n');
    codeEl.value = snippet;
  }
  refreshPanel();

  panel.querySelector('#placement-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(codeEl.value).catch(() => {});
  });

  function placementPointFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    if (!modelRoot) return null;
    const hits = raycaster.intersectObject(modelRoot, true);
    return hits.length ? hits[0].point : null;
  }

  renderer.domElement.addEventListener('pointerdown', (e) => { downPos = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!placingId || !downPos) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;
    if (moved > 6) return;
    const point = placementPointFromEvent(e);
    if (!point) return;
    const h = HOTSPOTS.find((x) => x.id === placingId);
    h.position = [point.x, point.y, point.z];
    h.placed = true;
    const entry = activeHotspots.find((x) => x.id === placingId);
    if (entry) {
      entry.position.copy(point);
      projectPinToScreen(entry);
    }
    refreshPanel();
  });
}
