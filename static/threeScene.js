// /static/threeScene.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";

const container = document.getElementById("threeContainer");
if (!container) throw new Error("Missing #threeContainer");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05010f, 0.04);

// ===== Renderer =====
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// ===== Camera (cinematic) =====
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 200);
camera.position.set(0, 1.5, 6.5);

// ===== Lights =====
const hemi = new THREE.HemisphereLight(0x8a5cff, 0x05010f, 0.9);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 6, 4);
key.castShadow = false;
scene.add(key);

const rim = new THREE.PointLight(0xb56bff, 2.2, 30);
rim.position.set(-3, 2, 2);
scene.add(rim);

const portalLight = new THREE.PointLight(0xa000ff, 0.0, 18);
portalLight.position.set(-2.8, 0.8, 0.0);
scene.add(portalLight);

// ===== Ground (invisible but helps lighting feel) =====
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x06020f, roughness: 1, metalness: 0, transparent: true, opacity: 0.0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// ======================================================
// PORTAL MAGIC CIRCLE (Three.js) + particles
// ======================================================
const portalGroup = new THREE.Group();
portalGroup.position.set(-2.8, 0.55, 0.0); // vị trí portal bên trái
scene.add(portalGroup);

const circleTex = makeMagicTexture(); // texture tự vẽ bằng canvas
const portalMat = new THREE.MeshBasicMaterial({
  map: circleTex,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.0
});

const portalRing = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), portalMat);
portalRing.rotation.x = -0.25;
portalGroup.add(portalRing);

// Inner glow
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xa000ff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  opacity: 0.0,
  depthWrite: false
});
const portalGlow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), glowMat);
portalGlow.rotation.x = -0.25;
portalGlow.position.z = -0.01;
portalGroup.add(portalGlow);

// Particles
const pCount = 650;
const pGeo = new THREE.BufferGeometry();
const pos = new Float32Array(pCount * 3);
const spd = new Float32Array(pCount);
for (let i = 0; i < pCount; i++) {
  const r = 0.85 * Math.sqrt(Math.random());
  const a = Math.random() * Math.PI * 2;
  pos[i * 3 + 0] = Math.cos(a) * r;
  pos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
  pos[i * 3 + 2] = Math.sin(a) * r;
  spd[i] = 0.35 + Math.random() * 0.75;
}
pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
pGeo.setAttribute("aSpeed", new THREE.BufferAttribute(spd, 1));

const pMat = new THREE.PointsMaterial({
  color: 0xd8b0ff,
  size: 0.02,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const portalParticles = new THREE.Points(pGeo, pMat);
portalParticles.rotation.x = -0.25;
portalGroup.add(portalParticles);

// ======================================================
// LOAD WIZARD GLB
// ======================================================
let wizard = null;
let mixer = null;

const loader = new GLTFLoader();
loader.load(
  "/static/model/wizard.glb",
  (gltf) => {
    wizard = gltf.scene;

    // auto normalize size
    const box = new THREE.Box3().setFromObject(wizard);
    const size = new THREE.Vector3();
    box.getSize(size);

    const targetHeight = 2.2;
    const scale = targetHeight / Math.max(0.001, size.y);
    wizard.scale.setScalar(scale);

    // start position: inside portal (hidden below)
    wizard.position.set(-2.8, -1.2, 0.0);
    wizard.rotation.y = Math.PI * 0.12;
    wizard.visible = true;

    // improve materials (if any)
    wizard.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.side = THREE.FrontSide;
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });

    scene.add(wizard);

    // animations in glb (optional)
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(wizard);
      const clip = gltf.animations[0];
      const action = mixer.clipAction(clip);
      action.play();
    }

    // start cinematic
    runCinematic();
  },
  undefined,
  (err) => {
    console.error("GLB load error:", err);
    // nếu 404 -> sai path
    // nếu CORS -> server không serve .glb đúng
  }
);

// ======================================================
// POSTPROCESS (Bloom)
 // ======================================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.6, 0.2);
composer.addPass(bloom);

// ======================================================
// CINEMATIC TIMELINE
// ======================================================
let t0 = performance.now();
let state = "idle";
let stateStart = performance.now();

function setState(s) {
  state = s;
  stateStart = performance.now();
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { return t * t * (3 - 2 * t); } // smoothstep

function runCinematic() {
  // portal open -> wizard rise -> move to chair -> idle + bubble
  setState("portal_open");

  // show bubble text when seated (you can also update your HTML bubble)
  setTimeout(() => {
    const bubble = document.getElementById("wizardBubble");
    if (bubble) {
      bubble.textContent = "🪄 Ngươi muốn hỏi ta về điều gì?";
      bubble.classList.add("show");
    }
  }, 4800);
}

function animatePortal(elapsed) {
  // portal glow pulse + ring spin + particles swirl
  portalRing.rotation.z = elapsed * 0.55;
  portalGlow.scale.setScalar(1 + Math.sin(elapsed * 3.0) * 0.06);

  const positions = pGeo.attributes.position.array;
  const speeds = pGeo.attributes.aSpeed.array;
  for (let i = 0; i < pCount; i++) {
    const ix = i * 3;
    const x = positions[ix + 0];
    const z = positions[ix + 2];
    const ang = (elapsed * speeds[i]) * 0.9;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    positions[ix + 0] = x * cos - z * sin;
    positions[ix + 2] = x * sin + z * cos;
    positions[ix + 1] = Math.sin(elapsed * speeds[i] + i) * 0.03;
  }
  pGeo.attributes.position.needsUpdate = true;
}

function updateCinematic(now) {
  const elapsed = (now - t0) / 1000;
  animatePortal(elapsed);

  const dtState = (now - stateStart) / 1000;

  if (state === "portal_open") {
    // fade in portal
    const k = Math.min(1, dtState / 1.2);
    portalMat.opacity = lerp(0, 0.95, smooth(k));
    glowMat.opacity = lerp(0, 0.65, smooth(k));
    pMat.opacity = lerp(0, 0.85, smooth(k));
    portalLight.intensity = lerp(0, 4.0, smooth(k));

    // slight camera push-in
    camera.position.z = lerp(6.5, 6.0, smooth(k));

    if (dtState > 1.25) setState("wizard_rise");
  }

  if (state === "wizard_rise" && wizard) {
    // wizard rise from portal
    const k = Math.min(1, dtState / 1.6);
    wizard.position.y = lerp(-1.2, 0.15, smooth(k));
    wizard.position.x = -2.8;
    wizard.position.z = 0.0;

    // bloom stronger while rising
    bloom.strength = lerp(1.1, 1.45, smooth(k));

    if (dtState > 1.65) setState("wizard_move");
  }

  if (state === "wizard_move" && wizard) {
    // move to chair position (right side)
    const k = Math.min(1, dtState / 2.0);

    // target seat position match your CSS stage roughly
    const tx = 1.9, ty = 0.1, tz = 0.2;
    wizard.position.x = lerp(-2.8, tx, smooth(k));
    wizard.position.y = lerp(0.15, ty, smooth(k));
    wizard.position.z = lerp(0.0, tz, smooth(k));
    wizard.rotation.y = lerp(Math.PI * 0.12, -Math.PI * 0.12, smooth(k));

    // fade portal out after moving
    const pf = Math.max(0, 1 - k);
    portalMat.opacity = 0.95 * pf;
    glowMat.opacity = 0.65 * pf;
    pMat.opacity = 0.85 * pf;
    portalLight.intensity = 4.0 * pf;

    // camera settle
    camera.position.x = lerp(0.0, 0.35, smooth(k));
    camera.position.y = lerp(1.5, 1.45, smooth(k));
    camera.position.z = lerp(6.0, 5.8, smooth(k));

    if (dtState > 2.05) setState("idle");
  }

  if (state === "idle" && wizard) {
    // idle breathing + tiny head nod (fake “mouth talk” nếu model không có morph)
    const breathe = Math.sin(elapsed * 1.6) * 0.03;
    wizard.position.y = 0.1 + breathe;

    // subtle sway
    wizard.rotation.y += Math.sin(elapsed * 0.7) * 0.0008;

    bloom.strength = 0.95;
  }
}

// ======================================================
// RENDER LOOP
// ======================================================
const clock = new THREE.Clock();

function loop(now) {
  requestAnimationFrame(loop);

  const dt = clock.getDelta();
  if (mixer) mixer.update(dt);

  updateCinematic(now);

  composer.render();
}
requestAnimationFrame(loop);

// ======================================================
// RESIZE
// ======================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
});

// ======================================================
// MAGIC TEXTURE GEN
// ======================================================
function makeMagicTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, 512, 512);

  // outer ring
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(200,120,255,0.55)";
  ctx.lineWidth = 10;
  ctx.stroke();

  // dashed ring
  ctx.beginPath();
  ctx.setLineDash([16, 10]);
  ctx.arc(256, 256, 185, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.setLineDash([]);

  // inner glyphs (fake runes)
  ctx.save();
  ctx.translate(256, 256);
  for (let i = 0; i < 22; i++) {
    ctx.rotate((Math.PI * 2) / 22);
    ctx.fillStyle = "rgba(230,210,255,0.25)";
    ctx.fillRect(0, -170, 6, 18);
  }
  ctx.restore();

  // center glow
  const grd = ctx.createRadialGradient(256, 256, 10, 256, 256, 170);
  grd.addColorStop(0, "rgba(255,255,255,0.25)");
  grd.addColorStop(0.25, "rgba(160,0,255,0.18)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}