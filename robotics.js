import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.162.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.162.0/examples/jsm/loaders/GLTFLoader.js";

/* -------------------------------------------------------------------------- */
/* DOM */
/* -------------------------------------------------------------------------- */

const bgCanvas = document.getElementById("bg-fx-canvas");
const canvas = document.getElementById("robotics-canvas");

const catalogGrid = document.getElementById("catalog-grid");
const pieceSearch = document.getElementById("piece-search");
const pieceFileInput = document.getElementById("piece-file-input");

const resetCameraBtn = document.getElementById("reset-camera-btn");
const focusSelectedBtn = document.getElementById("focus-selected-btn");
const duplicateBtn = document.getElementById("duplicate-btn");
const deleteBtn = document.getElementById("delete-btn");
const clearSceneBtn = document.getElementById("clear-scene-btn");

const sceneCountEl = document.getElementById("scene-count");
const selectedNameEl = document.getElementById("selected-name");
const statusPill = document.getElementById("status-pill");

const inspectorName = document.getElementById("inspector-name");
const inspectorFile = document.getElementById("inspector-file");
const inspectorPosition = document.getElementById("inspector-position");
const inspectorRotation = document.getElementById("inspector-rotation");
const inspectorScale = document.getElementById("inspector-scale");

const catalogDataEl = document.getElementById("robotics-catalog-data");
const initialCatalog = catalogDataEl ? JSON.parse(catalogDataEl.textContent || "[]") : [];

/* -------------------------------------------------------------------------- */
/* MAIN SCENE */
/* -------------------------------------------------------------------------- */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020611);
scene.fog = new THREE.Fog(0x020611, 16, 82);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 500);
camera.position.set(10.5, 7.5, 11.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 1.8, 0);
controls.minDistance = 3;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.485;

const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const placedPieces = [];
let selectedPiece = null;
let hoveredPiece = null;
let pieceCounter = 0;

let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let isDragging = false;
let dragOffset = new THREE.Vector3();
let dragIntersection = new THREE.Vector3();

const selectionBox = new THREE.BoxHelper(undefined, 0x7ad7ff);
selectionBox.visible = false;
scene.add(selectionBox);

const hoverRing = new THREE.Mesh(
  new THREE.RingGeometry(0.52, 0.66, 60),
  new THREE.MeshBasicMaterial({
    color: 0x7ad7ff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  })
);
hoverRing.rotation.x = -Math.PI / 2;
hoverRing.visible = false;
scene.add(hoverRing);

const snapPreviewSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.13, 26, 26),
  new THREE.MeshBasicMaterial({
    color: 0x37e0a1,
    transparent: true,
    opacity: 0.95
  })
);
snapPreviewSphere.visible = false;
scene.add(snapPreviewSphere);

/* -------------------------------------------------------------------------- */
/* BACKGROUND FX SCENE */
/* -------------------------------------------------------------------------- */

const bgScene = new THREE.Scene();
const bgRenderer = new THREE.WebGLRenderer({
  canvas: bgCanvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
bgRenderer.outputColorSpace = THREE.SRGBColorSpace;

const bgCamera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
bgCamera.position.set(0, 2.6, 14);

const bgClock = new THREE.Clock();
const bgPieces = [];
let bgOrbs = [];

/* -------------------------------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------------------------------- */

function setStatus(text) {
  statusPill.textContent = text;
}

function round(value) {
  return Number(value).toFixed(2);
}

function normalizeName(text) {
  return (text || "").trim().toLowerCase();
}

function resizeRenderers() {
  const width = canvas.clientWidth || canvas.parentElement.clientWidth || 1200;
  const height = canvas.clientHeight || canvas.parentElement.clientHeight || 700;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const bgWidth = window.innerWidth;
  const bgHeight = window.innerHeight;
  bgRenderer.setSize(bgWidth, bgHeight, false);
  bgCamera.aspect = bgWidth / bgHeight;
  bgCamera.updateProjectionMatrix();
}

function mat(color, roughness = 0.38, metalness = 0.32, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity
  });
}

function addMesh(group, geometry, material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSnapPoint(group, { id, type, accepts = [], x = 0, y = 0, z = 0 }) {
  if (!group.userData.snapPoints) group.userData.snapPoints = [];
  group.userData.snapPoints.push({
    id,
    type,
    accepts,
    localPosition: new THREE.Vector3(x, y, z)
  });
}

function createGlowDisc(radius, color, opacity = 0.18) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  disc.rotation.x = -Math.PI / 2;
  return disc;
}

function createOrb(color, size = 0.6, opacity = 0.12) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(size, 20, 20),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity
    })
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN LIGHTING */
/* -------------------------------------------------------------------------- */

const hemiLight = new THREE.HemisphereLight(0xc7ddff, 0x060b16, 1.12);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.05);
keyLight.position.set(11, 17, 9);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 90;
keyLight.shadow.camera.left = -22;
keyLight.shadow.camera.right = 22;
keyLight.shadow.camera.top = 22;
keyLight.shadow.camera.bottom = -22;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x6fd8ff, 0.72);
fillLight.position.set(-11, 7, -8);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x8d63ff, 24, 70, 2);
rimLight.position.set(0, 8, -8);
scene.add(rimLight);

const cyanPoint = new THREE.PointLight(0x55e6ff, 18, 60, 2);
cyanPoint.position.set(0, 4, 8);
scene.add(cyanPoint);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(24, 110),
  new THREE.MeshStandardMaterial({
    color: 0x07101f,
    roughness: 0.96,
    metalness: 0.06
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const outerDisc = createGlowDisc(12.8, 0x58a6ff, 0.09);
outerDisc.position.y = 0.004;
scene.add(outerDisc);

const innerDisc = createGlowDisc(7.2, 0x8d63ff, 0.08);
innerDisc.position.y = 0.006;
scene.add(innerDisc);

const coreDisc = createGlowDisc(3.2, 0x55e6ff, 0.07);
coreDisc.position.y = 0.008;
scene.add(coreDisc);

const grid = new THREE.GridHelper(40, 40, 0x4b90ff, 0x203758);
grid.material.opacity = 0.24;
grid.material.transparent = true;
scene.add(grid);

const ring1 = new THREE.Mesh(
  new THREE.TorusGeometry(7.4, 0.03, 10, 130),
  new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.34 })
);
ring1.rotation.x = Math.PI / 2;
ring1.position.y = 0.013;
scene.add(ring1);

const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(11.8, 0.03, 10, 150),
  new THREE.MeshBasicMaterial({ color: 0x8d63ff, transparent: true, opacity: 0.22 })
);
ring2.rotation.x = Math.PI / 2;
ring2.position.y = 0.01;
scene.add(ring2);

const ring3 = new THREE.Mesh(
  new THREE.TorusGeometry(4.4, 0.025, 10, 100),
  new THREE.MeshBasicMaterial({ color: 0x55e6ff, transparent: true, opacity: 0.26 })
);
ring3.rotation.x = Math.PI / 2;
ring3.position.y = 0.015;
scene.add(ring3);

const starsGeometry = new THREE.BufferGeometry();
const starCount = 1100;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const radius = 38 + Math.random() * 32;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;

  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = 10 + radius * Math.cos(phi) * 0.35;
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}

starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

const stars = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({
    color: 0xa9d3ff,
    size: 0.09,
    transparent: true,
    opacity: 0.82,
    sizeAttenuation: true
  })
);
scene.add(stars);

/* -------------------------------------------------------------------------- */
/* BACKGROUND FX OBJECTS */
/* -------------------------------------------------------------------------- */

function bgWireMaterial(color, opacity = 0.18) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    wireframe: true
  });
}

function addBGGlow(color, radius = 1.2, opacity = 0.08) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 20),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity
    })
  );
}

function createHoloBoard() {
  const g = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.08, 1.8),
    bgWireMaterial(0x58a6ff, 0.18)
  );
  g.add(board);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.02, 8, 40),
    bgWireMaterial(0x7ad7ff, 0.26)
  );
  ringA.rotation.x = Math.PI / 2;
  ringA.position.set(-0.58, 0.1, 0);

  const ringB = ringA.clone();
  ringB.position.set(0.58, 0.1, 0);

  const glow = addBGGlow(0x7ad7ff, 1.2, 0.05);
  glow.scale.set(1.7, 0.35, 1.2);

  g.add(ringA, ringB, glow);
  return g;
}

function createHoloArm() {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.82, 0.42, 6),
    bgWireMaterial(0x8d63ff, 0.18)
  );
  base.position.y = -0.45;

  const arm1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 1.9, 0.34),
    bgWireMaterial(0x55e6ff, 0.2)
  );
  arm1.position.y = 0.7;
  arm1.rotation.z = 0.45;

  const arm2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 1.5, 0.26),
    bgWireMaterial(0x58a6ff, 0.24)
  );
  arm2.position.set(0.78, 1.76, 0);
  arm2.rotation.z = -0.68;

  const claw = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.025, 8, 30),
    bgWireMaterial(0x7ad7ff, 0.24)
  );
  claw.position.set(1.18, 2.22, 0);
  claw.rotation.y = Math.PI / 2;

  const glow = addBGGlow(0x55e6ff, 1.3, 0.05);
  glow.position.y = 0.95;
  glow.scale.set(1.1, 1.7, 1.1);

  g.add(base, arm1, arm2, claw, glow);
  return g;
}

function createHoloWheel() {
  const g = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.94, 0.18, 12, 42),
    bgWireMaterial(0x37e0a1, 0.16)
  );
  tire.rotation.y = Math.PI / 2;

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20),
    bgWireMaterial(0x7ad7ff, 0.22)
  );
  hub.rotation.z = Math.PI / 2;

  const glow = addBGGlow(0x37e0a1, 1.35, 0.045);

  g.add(tire, hub, glow);
  return g;
}

function createHoloSensor() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.12, 0.9),
    bgWireMaterial(0x58a6ff, 0.2)
  );

  const eye1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.24, 28),
    bgWireMaterial(0x7ad7ff, 0.22)
  );
  eye1.rotation.z = Math.PI / 2;
  eye1.position.set(-0.55, 0.22, 0);

  const eye2 = eye1.clone();
  eye2.position.set(0.55, 0.22, 0);

  const scan = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.02, 8, 42),
    bgWireMaterial(0x55e6ff, 0.18)
  );
  scan.position.y = 0.18;
  scan.rotation.x = Math.PI / 2;

  const glow = addBGGlow(0x58a6ff, 1.4, 0.05);
  glow.scale.set(1.4, 0.6, 1);

  g.add(body, eye1, eye2, scan, glow);
  return g;
}

function createBackgroundHolograms() {
  const specs = [
    { obj: createHoloBoard(), x: -9, y: 3.6, z: -18, speed: 0.24, bob: 0.55, rx: 0.002, ry: 0.005 },
    { obj: createHoloArm(), x: 8.8, y: 1.25, z: -16, speed: 0.32, bob: 0.75, rx: 0.003, ry: -0.004 },
    { obj: createHoloWheel(), x: -11.2, y: -1.6, z: -15, speed: 0.28, bob: 0.48, rx: 0.004, ry: 0.006 },
    { obj: createHoloSensor(), x: 11.2, y: -0.9, z: -18, speed: 0.22, bob: 0.42, rx: -0.003, ry: 0.005 },
    { obj: createHoloBoard(), x: 0, y: 4.5, z: -24, speed: 0.18, bob: 0.52, rx: 0.002, ry: -0.003 },
    { obj: createHoloWheel(), x: 0, y: -3.4, z: -20, speed: 0.26, bob: 0.4, rx: 0.004, ry: 0.004 }
  ];

  specs.forEach((spec, i) => {
    spec.obj.position.set(spec.x, spec.y, spec.z);
    spec.obj.rotation.set(i * 0.1, i * 0.2, 0);
    spec.obj.userData.floatSpeed = spec.speed;
    spec.obj.userData.floatAmp = spec.bob;
    spec.obj.userData.baseY = spec.y;
    spec.obj.userData.rx = spec.rx;
    spec.obj.userData.ry = spec.ry;
    spec.obj.userData.phase = i * 1.45;

    bgPieces.push(spec.obj);
    bgScene.add(spec.obj);
  });

  const pointsGeometry = new THREE.BufferGeometry();
  const count = 900;
  const arr = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 70;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 34;
    arr[i * 3 + 2] = -6 - Math.random() * 60;
  }

  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));

  const points = new THREE.Points(
    pointsGeometry,
    new THREE.PointsMaterial({
      color: 0x97ccff,
      size: 0.08,
      transparent: true,
      opacity: 0.62,
      sizeAttenuation: true
    })
  );
  points.userData.isBGPoints = true;
  bgScene.add(points);

  const orb1 = createOrb(0x58a6ff, 3.2, 0.06);
  orb1.position.set(-10, 2, -8);

  const orb2 = createOrb(0x8d63ff, 2.8, 0.05);
  orb2.position.set(10, 1, -10);

  const orb3 = createOrb(0x55e6ff, 2.5, 0.045);
  orb3.position.set(0, -3, -8);

  bgOrbs = [orb1, orb2, orb3];
  bgScene.add(orb1, orb2, orb3);

  const bgLight1 = new THREE.PointLight(0x58a6ff, 12, 90, 2);
  bgLight1.position.set(-8, 3, 6);
  bgScene.add(bgLight1);

  const bgLight2 = new THREE.PointLight(0x8d63ff, 11, 90, 2);
  bgLight2.position.set(8, 1, 4);
  bgScene.add(bgLight2);

  const bgLight3 = new THREE.PointLight(0x55e6ff, 8, 90, 2);
  bgLight3.position.set(0, -2, 5);
  bgScene.add(bgLight3);
}

/* -------------------------------------------------------------------------- */
/* NATIVE PIECES */
/* -------------------------------------------------------------------------- */

function createNativePiece(pieceId, displayName) {
  const group = new THREE.Group();
  group.name = displayName || pieceId;

  const dark = mat(0x171d2b, 0.72, 0.08);
  const black = mat(0x0c0f15, 0.88, 0.05);
  const blue = mat(0x2f7cff, 0.34, 0.35, 0x102040, 0.15);
  const sky = mat(0x7ad7ff, 0.24, 0.32, 0x103040, 0.14);
  const red = mat(0xff5a6e, 0.34, 0.22, 0x2a0c12, 0.12);
  const yellow = mat(0xffd84d, 0.36, 0.18, 0x2c2609, 0.08);
  const green = mat(0x2fdf9d, 0.36, 0.2, 0x072114, 0.12);
  const gray = mat(0x7d8596, 0.62, 0.14);
  const silver = mat(0xcfd7e6, 0.24, 0.72);
  const white = mat(0xf3f6fb, 0.48, 0.08);
  const copper = mat(0xb87333, 0.34, 0.72);

  if (pieceId === "microbit") {
    addMesh(group, new THREE.BoxGeometry(2.6, 0.14, 1.95), dark, 0, 0.07, 0);
    addMesh(group, new THREE.BoxGeometry(2.42, 0.03, 1.78), black, 0, 0.155, 0);
    addMesh(group, new THREE.BoxGeometry(1.08, 0.08, 0.72), black, -0.56, 0.2, -0.12);
    addMesh(group, new THREE.BoxGeometry(0.38, 0.08, 0.38), yellow, 0.72, 0.2, -0.34);
    addMesh(group, new THREE.BoxGeometry(0.38, 0.08, 0.38), yellow, 0.72, 0.2, 0.34);
    addMesh(group, new THREE.BoxGeometry(0.56, 0.06, 0.22), black, 0.12, 0.19, 0.74);

    for (let i = -4; i <= 4; i++) {
      addMesh(group, new THREE.BoxGeometry(0.13, 0.06, 0.13), white, -0.72 + (i * 0.18), 0.18, -0.58);
      addMesh(group, new THREE.BoxGeometry(0.13, 0.06, 0.13), white, -0.72 + (i * 0.18), 0.18, -0.32);
    }

    addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), copper, -0.94, 0.035, 0.94, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), copper, 0, 0.035, 0.94, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), copper, 0.94, 0.035, 0.94, Math.PI / 2, 0, 0);

    addSnapPoint(group, { id: "mb_mount", type: "board_mount", accepts: ["board_mount"], x: 0, y: 0.08, z: 0 });
  }

  else if (pieceId === "servo_motor") {
    addMesh(group, new THREE.BoxGeometry(1.35, 1.72, 1.02), blue, 0, 0.86, 0);
    addMesh(group, new THREE.BoxGeometry(1.72, 0.18, 1.2), sky, 0, 1.08, 0);
    addMesh(group, new THREE.CylinderGeometry(0.28, 0.28, 0.16, 34), white, 0, 1.28, 0);
    addMesh(group, new THREE.CylinderGeometry(0.1, 0.1, 0.18, 24), silver, 0, 1.44, 0);
    addMesh(group, new THREE.BoxGeometry(0.25, 0.25, 1.08), dark, 0, 0.32, 0.58);

    addMesh(group, new THREE.BoxGeometry(0.045, 0.045, 0.92), red, -0.13, 0.32, 1.22);
    addMesh(group, new THREE.BoxGeometry(0.045, 0.045, 0.92), yellow, 0, 0.32, 1.22);
    addMesh(group, new THREE.BoxGeometry(0.045, 0.045, 0.92), black, 0.13, 0.32, 1.22);

    addSnapPoint(group, { id: "servo_bottom", type: "servo_mount", accepts: ["servo_mount"], x: 0, y: 0, z: 0 });
    addSnapPoint(group, { id: "servo_shaft", type: "shaft", accepts: ["wheel_shaft"], x: 0, y: 1.44, z: 0 });
  }

  else if (pieceId === "ultrasonic_sensor") {
    addMesh(group, new THREE.BoxGeometry(2.12, 0.2, 1.08), blue, 0, 0.1, 0);
    addMesh(group, new THREE.CylinderGeometry(0.4, 0.4, 0.28, 36), gray, -0.6, 0.42, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.4, 0.4, 0.28, 36), gray, 0.6, 0.42, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.29, 0.29, 0.3, 36), black, -0.6, 0.42, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.29, 0.29, 0.3, 36), black, 0.6, 0.42, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.BoxGeometry(0.72, 0.08, 0.14), black, 0, 0.22, 0.38);

    for (let i = 0; i < 4; i++) {
      addMesh(group, new THREE.BoxGeometry(0.075, 0.2, 0.075), copper, 0.54 - (i * 0.18), -0.02, -0.38);
    }

    addSnapPoint(group, { id: "us_bottom", type: "sensor_mount", accepts: ["sensor_mount"], x: 0, y: 0, z: 0 });
  }

  else if (pieceId === "wheel") {
    addMesh(group, new THREE.CylinderGeometry(0.74, 0.74, 0.44, 48), black, 0, 0.74, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.32, 0.32, 0.46, 36), gray, 0, 0.74, 0, Math.PI / 2, 0, 0);
    addMesh(group, new THREE.CylinderGeometry(0.11, 0.11, 0.52, 24), silver, 0, 0.74, 0, Math.PI / 2, 0, 0);

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const spoke = addMesh(
        group,
        new THREE.BoxGeometry(0.08, 0.08, 0.56),
        gray,
        Math.cos(angle) * 0.18,
        0.74,
        Math.sin(angle) * 0.18
      );
      spoke.rotation.y = angle;
      spoke.rotation.x = Math.PI / 2;
    }

    addSnapPoint(group, { id: "wheel_center", type: "wheel_shaft", accepts: ["shaft"], x: 0, y: 0.74, z: 0 });
  }

  else if (pieceId === "chassis") {
    addMesh(group, new THREE.BoxGeometry(4.1, 0.2, 2.7), gray, 0, 0.1, 0);
    addMesh(group, new THREE.BoxGeometry(3.62, 0.08, 2.18), dark, 0, 0.24, 0);

    addMesh(group, new THREE.CylinderGeometry(0.14, 0.14, 0.2, 20), black, -1.7, 0.11, -1.02);
    addMesh(group, new THREE.CylinderGeometry(0.14, 0.14, 0.2, 20), black, 1.7, 0.11, -1.02);
    addMesh(group, new THREE.CylinderGeometry(0.14, 0.14, 0.2, 20), black, -1.7, 0.11, 1.02);
    addMesh(group, new THREE.CylinderGeometry(0.14, 0.14, 0.2, 20), black, 1.7, 0.11, 1.02);

    addMesh(group, new THREE.BoxGeometry(0.58, 0.08, 1.86), sky, -1.18, 0.18, 0);
    addMesh(group, new THREE.BoxGeometry(0.58, 0.08, 1.86), sky, 1.18, 0.18, 0);

    addSnapPoint(group, { id: "chassis_center", type: "board_mount", accepts: ["board_mount"], x: 0, y: 0.2, z: 0 });
    addSnapPoint(group, { id: "servo_left", type: "servo_mount", accepts: ["servo_mount"], x: -1.48, y: 0.2, z: 0 });
    addSnapPoint(group, { id: "servo_right", type: "servo_mount", accepts: ["servo_mount"], x: 1.48, y: 0.2, z: 0 });
    addSnapPoint(group, { id: "sensor_front", type: "sensor_mount", accepts: ["sensor_mount"], x: 0, y: 0.2, z: -1.2 });
    addSnapPoint(group, { id: "battery_back", type: "battery_mount", accepts: ["battery_mount"], x: 0, y: 0.2, z: 0.9 });
  }

  else if (pieceId === "battery_pack") {
    addMesh(group, new THREE.BoxGeometry(2, 0.86, 1.2), black, 0, 0.43, 0);
    addMesh(group, new THREE.BoxGeometry(1.36, 0.14, 1.02), red, 0, 0.86, 0);
    addMesh(group, new THREE.BoxGeometry(0.06, 0.06, 0.62), red, -0.2, 0.43, 0.96);
    addMesh(group, new THREE.BoxGeometry(0.06, 0.06, 0.62), black, 0.2, 0.43, 0.96);

    addSnapPoint(group, { id: "battery_bottom", type: "battery_mount", accepts: ["battery_mount"], x: 0, y: 0, z: 0 });
  }

  else if (pieceId === "motor_driver") {
    addMesh(group, new THREE.BoxGeometry(2.44, 0.16, 1.82), green, 0, 0.08, 0);
    addMesh(group, new THREE.BoxGeometry(0.62, 0.3, 0.62), black, -0.48, 0.24, -0.26);
    addMesh(group, new THREE.BoxGeometry(0.62, 0.3, 0.62), black, 0.48, 0.24, -0.26);
    addMesh(group, new THREE.BoxGeometry(0.5, 0.24, 0.5), dark, 0, 0.21, 0.34);

    for (let i = 0; i < 6; i++) {
      addMesh(group, new THREE.BoxGeometry(0.08, 0.14, 0.08), copper, -0.88 + (i * 0.35), 0.14, 0.76);
    }

    addSnapPoint(group, { id: "driver_bottom", type: "board_mount", accepts: ["board_mount"], x: 0, y: 0, z: 0 });
  }

  else if (pieceId === "breadboard") {
    addMesh(group, new THREE.BoxGeometry(3.1, 0.26, 1.8), white, 0, 0.13, 0);
    addMesh(group, new THREE.BoxGeometry(2.86, 0.03, 1.54), gray, 0, 0.27, 0);

    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 14; i++) {
        addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), gray, -1.28 + (i * 0.2), 0.28, row === 0 ? -0.42 : 0.42);
      }
    }

    addSnapPoint(group, { id: "breadboard_bottom", type: "board_mount", accepts: ["board_mount"], x: 0, y: 0, z: 0 });
  }

  else if (pieceId === "led") {
    addMesh(group, new THREE.CylinderGeometry(0.014, 0.014, 0.55, 10), silver, -0.055, 0.26, 0);
    addMesh(group, new THREE.CylinderGeometry(0.014, 0.014, 0.45, 10), silver, 0.055, 0.21, 0);
    addMesh(group, new THREE.SphereGeometry(0.26, 24, 24), red, 0, 0.56, 0);
    addMesh(group, new THREE.CylinderGeometry(0.26, 0.2, 0.26, 24), red, 0, 0.34, 0);
  }

  else if (pieceId === "buzzer") {
    addMesh(group, new THREE.CylinderGeometry(0.56, 0.56, 0.48, 36), black, 0, 0.24, 0);
    addMesh(group, new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), gray, 0, 0.49, 0);
    addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), copper, -0.14, -0.03, 0);
    addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 0.34, 10), copper, 0.14, -0.03, 0);
  }

  else {
    addMesh(group, new THREE.BoxGeometry(1, 1, 1), blue, 0, 0.5, 0);
  }

  group.userData.isNativePiece = true;
  group.userData.snapPoints = group.userData.snapPoints || [];
  return group;
}

function centerPieceOnGround(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());

  root.position.x -= center.x;
  root.position.z -= center.z;

  const box2 = new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y;
}

function cloneRootWithShadows(root) {
  const cloned = root.clone(true);
  cloned.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.pickRoot = cloned;
    }
  });
  return cloned;
}

function updateSceneCount() {
  sceneCountEl.textContent = String(placedPieces.length);
}

function updateInspector() {
  if (!selectedPiece) {
    inspectorName.textContent = "Nenhuma peça selecionada";
    inspectorFile.textContent = "-";
    inspectorPosition.textContent = "x: 0 | y: 0 | z: 0";
    inspectorRotation.textContent = "x: 0 | y: 0 | z: 0";
    inspectorScale.textContent = "1";
    selectedNameEl.textContent = "nenhuma";
    selectionBox.visible = false;
    return;
  }

  const p = selectedPiece.position;
  const r = selectedPiece.rotation;
  const s = selectedPiece.scale;

  inspectorName.textContent = selectedPiece.userData.displayName || selectedPiece.name || "Sem nome";
  inspectorFile.textContent = selectedPiece.userData.sourceFile || "-";
  inspectorPosition.textContent = `x: ${round(p.x)} | y: ${round(p.y)} | z: ${round(p.z)}`;
  inspectorRotation.textContent = `x: ${round(THREE.MathUtils.radToDeg(r.x))}° | y: ${round(THREE.MathUtils.radToDeg(r.y))}° | z: ${round(THREE.MathUtils.radToDeg(r.z))}°`;
  inspectorScale.textContent = `${round(s.x)}`;
  selectedNameEl.textContent = selectedPiece.userData.displayName || "nenhuma";

  selectionBox.setFromObject(selectedPiece);
  selectionBox.visible = true;
}

function setSelectedPiece(piece) {
  selectedPiece = piece || null;
  updateInspector();

  if (selectedPiece) {
    setStatus(`Peça selecionada: ${selectedPiece.userData.displayName || selectedPiece.name}`);
  } else {
    setStatus("Nenhuma peça selecionada.");
  }
}

function updateHover(piece) {
  hoveredPiece = piece || null;

  if (!hoveredPiece) {
    hoverRing.visible = false;
    return;
  }

  const box = new THREE.Box3().setFromObject(hoveredPiece);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  hoverRing.position.set(center.x, 0.016, center.z);
  hoverRing.scale.setScalar(Math.max(0.8, Math.max(size.x, size.z)));
  hoverRing.visible = true;
}

function registerPiece(root, meta = {}) {
  pieceCounter += 1;

  root.userData.displayName = meta.name || root.userData.displayName || `Peça ${pieceCounter}`;
  root.userData.sourceFile = meta.file || meta.url || "nativa";
  root.userData.catalogId = meta.id || null;
  root.userData.instanceId = `piece-${pieceCounter}`;
  root.userData.isNativePiece = Boolean(meta.isNativePiece);
  root.userData.snapPoints = root.userData.snapPoints || [];

  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.pickRoot = root;
    }
  });

  placedPieces.push(root);
  scene.add(root);
  updateSceneCount();
  setSelectedPiece(root);
}

function spawnNativePiece(meta, position = null) {
  const root = createNativePiece(meta.id, meta.name);
  centerPieceOnGround(root);

  if (position) {
    root.position.copy(position);
  } else {
    root.position.x += (placedPieces.length % 4) * 2.2 - 3.4;
    root.position.z += Math.floor(placedPieces.length / 4) * 2.1 - 2.2;
  }

  registerPiece(root, {
    ...meta,
    file: `nativa:${meta.id}`,
    isNativePiece: true
  });

  setStatus(`Peça 3D adicionada: ${meta.name}`);
}

function loadModelFromUrl(url, meta = {}, position = null) {
  setStatus(`Carregando GLB de ${meta.name}...`);

  loader.load(
    url,
    (gltf) => {
      const rootSource = gltf.scene || gltf.scenes?.[0];

      if (!rootSource) {
        spawnNativePiece(meta, position);
        return;
      }

      const root = cloneRootWithShadows(rootSource);
      centerPieceOnGround(root);
      root.userData.snapPoints = root.userData.snapPoints || [];

      if (position) {
        root.position.copy(position);
      } else {
        root.position.x += (placedPieces.length % 4) * 2.2 - 3.4;
        root.position.z += Math.floor(placedPieces.length / 4) * 2.1 - 2.2;
      }

      registerPiece(root, {
        ...meta,
        isNativePiece: false
      });

      setStatus(`Modelo GLB carregado: ${meta.name}`);
    },
    undefined,
    () => {
      spawnNativePiece(meta, position);
    }
  );
}

function addCatalogPiece(meta) {
  if (meta.has_glb && meta.url) {
    loadModelFromUrl(meta.url, meta);
  } else {
    spawnNativePiece(meta);
  }
}

function removeSelectedPiece() {
  if (!selectedPiece) return;

  const index = placedPieces.indexOf(selectedPiece);
  if (index >= 0) placedPieces.splice(index, 1);

  scene.remove(selectedPiece);
  snapPreviewSphere.visible = false;
  setSelectedPiece(null);
  updateSceneCount();
  setStatus("Peça removida.");
}

function duplicateSelectedPiece() {
  if (!selectedPiece) return;

  let clone;
  if (selectedPiece.userData.isNativePiece && selectedPiece.userData.catalogId) {
    clone = createNativePiece(selectedPiece.userData.catalogId, selectedPiece.userData.displayName);
  } else {
    clone = cloneRootWithShadows(selectedPiece);
  }

  centerPieceOnGround(clone);
  clone.position.copy(selectedPiece.position);
  clone.rotation.copy(selectedPiece.rotation);
  clone.scale.copy(selectedPiece.scale);
  clone.position.x += 1.4;
  clone.position.z += 1.2;
  clone.userData.snapPoints = JSON.parse(JSON.stringify(selectedPiece.userData.snapPoints || []));

  registerPiece(clone, {
    name: `${selectedPiece.userData.displayName || "Peça"} Cópia`,
    file: selectedPiece.userData.sourceFile || "-",
    id: selectedPiece.userData.catalogId || null,
    isNativePiece: Boolean(selectedPiece.userData.isNativePiece)
  });

  setStatus("Peça duplicada.");
}

function clearScenePieces() {
  for (const piece of placedPieces) {
    scene.remove(piece);
  }
  placedPieces.length = 0;
  snapPreviewSphere.visible = false;
  setSelectedPiece(null);
  updateSceneCount();
  setStatus("Cena limpa.");
}

/* -------------------------------------------------------------------------- */
/* SNAP */
/* -------------------------------------------------------------------------- */

function getWorldSnapPoints(piece) {
  const out = [];
  const snapPoints = piece.userData.snapPoints || [];

  for (const sp of snapPoints) {
    out.push({
      ...sp,
      piece,
      worldPosition: piece.localToWorld(sp.localPosition.clone())
    });
  }

  return out;
}

function areSnapCompatible(a, b) {
  if (!a || !b) return false;
  if (a.piece === b.piece) return false;
  if (a.accepts.includes(b.type)) return true;
  if (b.accepts.includes(a.type)) return true;
  return false;
}

function findBestSnapForPiece(movingPiece) {
  if (!movingPiece) return null;

  const movingPoints = getWorldSnapPoints(movingPiece);
  if (!movingPoints.length) return null;

  let best = null;

  for (const movingPoint of movingPoints) {
    for (const otherPiece of placedPieces) {
      if (otherPiece === movingPiece) continue;

      const otherPoints = getWorldSnapPoints(otherPiece);
      for (const otherPoint of otherPoints) {
        if (!areSnapCompatible(movingPoint, otherPoint)) continue;

        const dist = movingPoint.worldPosition.distanceTo(otherPoint.worldPosition);
        if (dist > 0.75) continue;

        if (!best || dist < best.distance) {
          best = {
            movingPoint,
            targetPoint: otherPoint,
            distance: dist
          };
        }
      }
    }
  }

  return best;
}

function snapPieceToTarget(movingPiece, snapResult) {
  if (!movingPiece || !snapResult) return;

  const movingWorld = snapResult.movingPoint.worldPosition.clone();
  const targetWorld = snapResult.targetPoint.worldPosition.clone();
  const delta = targetWorld.sub(movingWorld);

  movingPiece.position.add(delta);
  updateInspector();
}

function updateSnapPreview() {
  if (!selectedPiece) {
    snapPreviewSphere.visible = false;
    return;
  }

  const best = findBestSnapForPiece(selectedPiece);
  if (!best) {
    snapPreviewSphere.visible = false;
    return;
  }

  snapPreviewSphere.position.copy(best.targetPoint.worldPosition);
  snapPreviewSphere.visible = true;
}

/* -------------------------------------------------------------------------- */
/* UI RENDER */
/* -------------------------------------------------------------------------- */

function renderCatalog(items) {
  if (!items.length) {
    catalogGrid.innerHTML = `
      <div class="empty-note">
        Nenhuma peça encontrada.
      </div>
    `;
    return;
  }

  catalogGrid.innerHTML = items.map((item) => `
    <div class="piece-card">
      <div class="piece-top">
        <div>
          <h3 class="piece-name">${item.name}</h3>
          <div class="piece-type">${item.file || "peça nativa"}</div>
        </div>
        <span class="piece-badge ${item.has_glb ? "glb" : "native"}">${item.has_glb ? "GLB" : "3D"}</span>
      </div>

      <div class="piece-actions">
        <button
          class="mini-btn"
          data-action="add"
          data-id="${item.id || ""}"
          data-name="${item.name || ""}"
          data-file="${item.file || ""}"
          data-url="${item.url || ""}"
          data-has-glb="${item.has_glb ? "1" : "0"}"
          type="button"
        >
          Adicionar peça
        </button>
      </div>
    </div>
  `).join("");
}

function filterCatalog() {
  const term = normalizeName(pieceSearch.value);
  const filtered = initialCatalog.filter((item) => {
    return normalizeName(item.name).includes(term) || normalizeName(item.file).includes(term);
  });
  renderCatalog(filtered);
}

/* -------------------------------------------------------------------------- */
/* INPUT */
/* -------------------------------------------------------------------------- */

function getSceneIntersections(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const meshes = [];
  placedPieces.forEach((root) => {
    root.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
  });

  return raycaster.intersectObjects(meshes, false);
}

function findRootFromIntersection(intersection) {
  if (!intersection || !intersection.object) return null;
  return intersection.object.userData.pickRoot || null;
}

function moveSelected(dx, dz) {
  if (!selectedPiece) return;
  selectedPiece.position.x += dx;
  selectedPiece.position.z += dz;
  updateInspector();
  updateSnapPreview();
}

function rotateSelected(deltaY) {
  if (!selectedPiece) return;
  selectedPiece.rotation.y += deltaY;
  updateInspector();
  updateSnapPreview();
}

function liftSelected(deltaY) {
  if (!selectedPiece) return;
  selectedPiece.position.y = Math.max(0, selectedPiece.position.y + deltaY);
  updateInspector();
  updateSnapPreview();
}

function focusSelected() {
  if (!selectedPiece) return;

  const box = new THREE.Box3().setFromObject(selectedPiece);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.5 * Math.max(fitHeightDistance, fitWidthDistance, 3);

  const direction = new THREE.Vector3(1, 0.74, 1).normalize();
  camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
  controls.target.copy(center);
  controls.update();
}

function resetCamera() {
  camera.position.set(10.5, 7.5, 11.5);
  controls.target.set(0, 1.8, 0);
  controls.update();
  setStatus("Câmera reposicionada.");
}

function onKeyDown(event) {
  const step = event.shiftKey ? 0.25 : 0.1;
  const rotStep = event.shiftKey ? 0.18 : 0.08;

  switch (event.key) {
    case "ArrowUp":
    case "w":
    case "W":
      moveSelected(0, -step);
      break;
    case "ArrowDown":
    case "s":
    case "S":
      moveSelected(0, step);
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      moveSelected(-step, 0);
      break;
    case "ArrowRight":
    case "d":
    case "D":
      moveSelected(step, 0);
      break;
    case "q":
    case "Q":
      rotateSelected(rotStep);
      break;
    case "e":
    case "E":
      rotateSelected(-rotStep);
      break;
    case "r":
    case "R":
      liftSelected(step);
      break;
    case "f":
    case "F":
      liftSelected(-step);
      break;
    case "Enter": {
      const best = findBestSnapForPiece(selectedPiece);
      if (best) {
        snapPieceToTarget(selectedPiece, best);
        setStatus("Snap aplicado.");
        updateSnapPreview();
      }
      break;
    }
    case "Delete":
    case "Backspace":
      removeSelectedPiece();
      break;
    default:
      return;
  }
}

function onPointerDown(event) {
  const intersections = getSceneIntersections(event);
  const root = intersections.length ? findRootFromIntersection(intersections[0]) : null;
  setSelectedPiece(root);

  if (root) {
    isDragging = true;
    controls.enabled = false;

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());

    if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
      dragOffset.copy(center).sub(dragIntersection);
    } else {
      dragOffset.set(0, 0, 0);
    }
  }
}

function onPointerMove(event) {
  const intersections = getSceneIntersections(event);
  const root = intersections.length ? findRootFromIntersection(intersections[0]) : null;
  updateHover(root);

  if (!isDragging || !selectedPiece) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.ray.intersectPlane(dragPlane, dragIntersection)) {
    selectedPiece.position.x = dragIntersection.x + dragOffset.x;
    selectedPiece.position.z = dragIntersection.z + dragOffset.z;
    selectedPiece.position.y = Math.max(0, selectedPiece.position.y);
    updateInspector();
    updateSnapPreview();
  }
}

function onPointerUp() {
  if (isDragging && selectedPiece) {
    const best = findBestSnapForPiece(selectedPiece);
    if (best) {
      snapPieceToTarget(selectedPiece, best);
      setStatus("Peça encaixada automaticamente.");
    }
    updateSnapPreview();
  }

  isDragging = false;
  controls.enabled = true;
}

function loadModelFromFile(file) {
  if (!file) return;

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".glb") && !lower.endsWith(".gltf")) {
    setStatus("Arquivo inválido. Use .glb ou .gltf.");
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  setStatus("Importando peça externa...");

  loader.load(
    objectUrl,
    (gltf) => {
      const rootSource = gltf.scene || gltf.scenes?.[0];
      if (!rootSource) {
        setStatus("Modelo externo inválido.");
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const root = cloneRootWithShadows(rootSource);
      centerPieceOnGround(root);
      root.position.x = 0;
      root.position.z = 4;
      root.userData.snapPoints = root.userData.snapPoints || [];

      registerPiece(root, {
        name: file.name.replace(/\.(glb|gltf)$/i, ""),
        file: file.name,
        url: file.name,
        isNativePiece: false
      });

      setStatus(`Peça externa importada: ${file.name}`);
      URL.revokeObjectURL(objectUrl);
    },
    undefined,
    () => {
      setStatus("Falha ao importar peça externa.");
      URL.revokeObjectURL(objectUrl);
    }
  );
}

/* -------------------------------------------------------------------------- */
/* STARTER SCENE */
/* -------------------------------------------------------------------------- */

function catalogMetaById(id, fallbackName) {
  const found = initialCatalog.find((item) => item.id === id);
  if (found) return found;
  return {
    id,
    name: fallbackName,
    file: `${id}.glb`,
    url: null,
    has_glb: false
  };
}

function addCatalogPieceAt(id, name, position) {
  const meta = catalogMetaById(id, name);

  if (meta.has_glb && meta.url) {
    loadModelFromUrl(meta.url, meta, position);
  } else {
    spawnNativePiece(meta, position);
  }
}

function loadStarterScene() {
  addCatalogPieceAt("chassis", "Chassi", new THREE.Vector3(0, 0, 0));
  addCatalogPieceAt("servo_motor", "Servo Motor", new THREE.Vector3(-1.48, 0.2, 0));
  addCatalogPieceAt("servo_motor", "Servo Motor", new THREE.Vector3(1.48, 0.2, 0));
  addCatalogPieceAt("wheel", "Roda", new THREE.Vector3(-1.48, 1.64, 0));
  addCatalogPieceAt("wheel", "Roda", new THREE.Vector3(1.48, 1.64, 0));
  addCatalogPieceAt("microbit", "Micro:bit", new THREE.Vector3(0, 0.22, 0.1));
  addCatalogPieceAt("ultrasonic_sensor", "Sensor Ultrassônico", new THREE.Vector3(0, 0.22, -1.18));
  addCatalogPieceAt("battery_pack", "Bateria", new THREE.Vector3(0, 0.22, 0.92));

  setStatus("Mesa holográfica ativa com peças 3D carregadas.");
}

/* -------------------------------------------------------------------------- */
/* EVENTS */
/* -------------------------------------------------------------------------- */

catalogGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='add']");
  if (!button) return;

  const meta = {
    id: button.dataset.id || null,
    name: button.dataset.name || "Peça",
    file: button.dataset.file || "peça",
    url: button.dataset.url || null,
    has_glb: button.dataset.hasGlb === "1"
  };

  addCatalogPiece(meta);
});

pieceSearch.addEventListener("input", filterCatalog);

pieceFileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) loadModelFromFile(file);
  event.target.value = "";
});

resetCameraBtn.addEventListener("click", resetCamera);
focusSelectedBtn.addEventListener("click", focusSelected);
duplicateBtn.addEventListener("click", duplicateSelectedPiece);
deleteBtn.addEventListener("click", removeSelectedPiece);
clearSceneBtn.addEventListener("click", clearScenePieces);

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);

window.addEventListener("keydown", onKeyDown);
window.addEventListener("resize", resizeRenderers);

/* -------------------------------------------------------------------------- */
/* ANIMATION */
/* -------------------------------------------------------------------------- */

function animateBackground() {
  const t = bgClock.getElapsedTime();

  bgPieces.forEach((obj) => {
    obj.position.y = obj.userData.baseY + Math.sin(t * obj.userData.floatSpeed + obj.userData.phase) * obj.userData.floatAmp;
    obj.rotation.x += obj.userData.rx;
    obj.rotation.y += obj.userData.ry;
  });

  bgScene.traverse((child) => {
    if (child.isPoints && child.userData.isBGPoints) {
      child.rotation.y += 0.0009;
      child.rotation.x = Math.sin(t * 0.15) * 0.03;
    }
  });

  if (bgOrbs.length === 3) {
    bgOrbs[0].position.x = -10 + Math.sin(t * 0.23) * 1.2;
    bgOrbs[1].position.x = 10 + Math.cos(t * 0.19) * 1.1;
    bgOrbs[2].position.y = -3 + Math.sin(t * 0.28) * 0.8;
  }

  bgCamera.position.x = Math.sin(t * 0.14) * 0.8;
  bgCamera.position.y = 2.6 + Math.cos(t * 0.18) * 0.35;
  bgCamera.lookAt(0, 0.4, -15);

  bgRenderer.render(bgScene, bgCamera);
}

function animateMain() {
  controls.update();

  ring1.rotation.z += 0.0015;
  ring2.rotation.z -= 0.001;
  ring3.rotation.z += 0.0021;
  stars.rotation.y += 0.00018;

  if (selectedPiece) {
    selectionBox.setFromObject(selectedPiece);
  }

  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  animateBackground();
  animateMain();
}

/* -------------------------------------------------------------------------- */
/* INIT */
/* -------------------------------------------------------------------------- */

createBackgroundHolograms();
resizeRenderers();
renderCatalog(initialCatalog);
updateSceneCount();
updateInspector();
loadStarterScene();
resetCamera();
animate();