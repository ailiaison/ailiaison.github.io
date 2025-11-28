// main.js

// Базовая настройка сцены
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 35);

// Группа с "сетевой" структурой
const networkGroup = new THREE.Group();
scene.add(networkGroup);

// Геометрия точек (узлы графа)
const NODE_COUNT = 260;
const nodePositions = new Float32Array(NODE_COUNT * 3);

for (let i = 0; i < NODE_COUNT; i++) {
  const i3 = i * 3;
  // Разброс в "объёмном" эллипсоиде
  const radius = 18;
  nodePositions[i3 + 0] = (Math.random() - 0.5) * 2 * radius;
  nodePositions[i3 + 1] = (Math.random() - 0.5) * 1.5 * radius;
  nodePositions[i3 + 2] = (Math.random() - 0.5) * 2 * radius;
}

const nodeGeometry = new THREE.BufferGeometry();
nodeGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(nodePositions, 3)
);

const nodeMaterial = new THREE.PointsMaterial({
  size: 0.12,
  color: new THREE.Color(0x7dd3fc),
  transparent: true,
  opacity: 0.95,
  depthWrite: false
});

const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
networkGroup.add(nodes);

// Линии между узлами (псевдо-libp2p mesh)
const maxLinksPerNode = 3;
const linePositions = [];

for (let i = 0; i < NODE_COUNT; i++) {
  // создаём несколько связей с другими узлами
  for (let k = 0; k < maxLinksPerNode; k++) {
    const j = Math.floor(Math.random() * NODE_COUNT);
    if (j === i) continue;

    const i3 = i * 3;
    const j3 = j * 3;

    linePositions.push(
      nodePositions[i3 + 0],
      nodePositions[i3 + 1],
      nodePositions[i3 + 2],
      nodePositions[j3 + 0],
      nodePositions[j3 + 1],
      nodePositions[j3 + 2]
    );
  }
}

const linePositionArray = new Float32Array(linePositions);
const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(linePositionArray, 3)
);

const lineMaterial = new THREE.LineBasicMaterial({
  color: new THREE.Color(0x38bdf8),
  transparent: true,
  opacity: 0.22
});

const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
networkGroup.add(lines);

// Лёгкая "аура" — гладкий сфера-контур
const auraGeometry = new THREE.SphereGeometry(21, 48, 48);
const auraMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0x22c55e),
  transparent: true,
  opacity: 0.08,
  wireframe: true
});
const aura = new THREE.Mesh(auraGeometry, auraMaterial);
networkGroup.add(aura);

// Лёгкое освещение (для объёма)
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

// Анимация
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  // Медленное вращение "сети"
  networkGroup.rotation.y = t * 0.06;
  networkGroup.rotation.x = Math.sin(t * 0.15) * 0.08;

  // Лёгкий пульс точек — имитация активности сети
  const baseSize = 0.12;
  const pulsing = 0.04 * Math.sin(t * 1.3);
  nodeMaterial.size = baseSize + pulsing;

  renderer.render(scene, camera);
}

animate();

// Ресайз
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
