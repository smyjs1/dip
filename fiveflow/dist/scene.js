// A quiet, decorative Three.js astrolabe. The existing HTML wheel is the fallback.
// No user input or personal data is read by this module.
const wheel = document.querySelector('.wheel-wrap');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (wheel && !motion.matches) {
  initFiveElementsScene().catch(() => {
    // Network, WebGL, or GPU failure leaves the existing static illustration intact.
  });
}

async function initFiveElementsScene() {
  // Version-pinned CDN module, following the Three.js installation guide.
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js');
  if (!wheel.isConnected || motion.matches) return;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 2.55, -2.55, 0.1, 30);
  camera.position.set(0, 0, 9);
  camera.lookAt(0, 0, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'gogyo-three';
  Object.assign(canvas.style, { position:'absolute', inset:'0', width:'100%', height:'100%', pointerEvents:'none', zIndex:'0' });
  for (const child of wheel.children) {
    if (getComputedStyle(child).position === 'static') child.style.position = 'relative';
    child.style.zIndex = '1';
  }
  wheel.prepend(canvas);

  const bronze = new THREE.MeshStandardMaterial({ color: 0x977b47, metalness: 0.45, roughness: 0.48, transparent: true, opacity: 0.78 });
  const softBronze = new THREE.LineBasicMaterial({ color: 0xa68b62, transparent: true, opacity: 0.55 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa64639, metalness: 0.16, roughness: 0.55 });
  const jade = new THREE.MeshStandardMaterial({ color: 0x506f61, metalness: 0.14, roughness: 0.52 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x52727b, metalness: 0.12, roughness: 0.5 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xc9b68d, metalness: 0.25, roughness: 0.45 });
  const clay = new THREE.MeshStandardMaterial({ color: 0xb2935c, metalness: 0.2, roughness: 0.55 });
  const solids = [jade, red, clay, cream, ink];
  scene.add(new THREE.AmbientLight(0xffffff, 2.0));
  const light = new THREE.DirectionalLight(0xffe7b1, 2.0);
  light.position.set(-3, 4, 8);
  scene.add(light);

  const disk = new THREE.Group();
  disk.rotation.x = -0.25;
  disk.rotation.y = 0.12;
  scene.add(disk);
  function addRing(radius, tube, material) {
    const geometry = new THREE.TorusGeometry(radius, tube, 8, 120);
    const ring = new THREE.Mesh(geometry, material);
    disk.add(ring);
  }
  addRing(1.91, 0.012, bronze);
  addRing(1.72, 0.008, bronze);
  addRing(1.53, 0.006, bronze);

  // Eight gently rotating trigrams surround the five fixed characters in the DOM.
  // Broken lines and solid lines are pure geometry, rather than an icon font.
  const trigrams = [7, 3, 5, 1, 6, 2, 4, 0];
  const barGeometry = new THREE.BoxGeometry(0.19, 0.018, 0.02);
  const halfBarGeometry = new THREE.BoxGeometry(0.074, 0.018, 0.02);
  trigrams.forEach((bits, index) => {
    const angle = index * Math.PI / 4;
    const trigram = new THREE.Group();
    trigram.position.set(Math.cos(angle) * 1.81, Math.sin(angle) * 1.81, 0.012);
    trigram.rotation.z = angle - Math.PI / 2;
    for (let row = 0; row < 3; row++) {
      const y = (row - 1) * 0.046;
      if (bits & (1 << row)) {
        const bar = new THREE.Mesh(barGeometry, bronze);
        bar.position.y = y;
        trigram.add(bar);
      } else {
        for (const x of [-0.058, 0.058]) {
          const bar = new THREE.Mesh(halfBarGeometry, bronze);
          bar.position.set(x, y, 0);
          trigram.add(bar);
        }
      }
    }
    disk.add(trigram);
  });

  // Five small stone-like beads orbit in front of a pair of fine gold rings.
  const beads = new THREE.Group();
  disk.add(beads);
  const beadGeometry = new THREE.SphereGeometry(0.045, 12, 10);
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5 + 0.3;
    const bead = new THREE.Mesh(beadGeometry, solids[i]);
    bead.position.set(Math.cos(angle) * 1.62, Math.sin(angle) * 1.62, 0.08);
    beads.add(bead);
  }

  // A few fine radial marks echo an old astronomical dial.
  const points = [];
  for (let i = 0; i < 48; i++) {
    const a = Math.PI * 2 * i / 48;
    const inner = i % 6 === 0 ? 1.97 : 2.00;
    points.push(new THREE.Vector3(Math.cos(a)*inner, Math.sin(a)*inner, 0));
    points.push(new THREE.Vector3(Math.cos(a)*2.035, Math.sin(a)*2.035, 0));
  }
  const ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), softBronze);
  disk.add(ticks);

  function resize() {
    const width = wheel.clientWidth, height = wheel.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    camera.left = -2.55 * aspect;
    camera.right = 2.55 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wheel);
  resize();

  let frame = 0;
  let visible = true;
  let last = 0;
  function animate(time) {
    if (!visible || document.hidden || motion.matches || !wheel.isConnected) { frame = 0; return; }
    if (last) {
      const delta = Math.min((time - last) / 1000, 0.05);
      disk.rotation.z += delta * 0.035;
      beads.rotation.z -= delta * 0.18;
    }
    last = time;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }
  function updatePlayback() {
    if (visible && !document.hidden && !motion.matches && wheel.isConnected) {
      last = 0;
      if (!frame) frame = requestAnimationFrame(animate);
    } else if (frame) {
      cancelAnimationFrame(frame); frame = 0; last = 0;
    }
  }
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updatePlayback();
  }, { threshold: 0.01 });
  intersection.observe(wheel);
  document.addEventListener('visibilitychange', updatePlayback);
  motion.addEventListener?.('change', updatePlayback);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    visible = false;
    updatePlayback();
    canvas.remove();
    resizeObserver.disconnect();
    intersection.disconnect();
  }, { once: true });
  updatePlayback();
}
