import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app') as HTMLDivElement;
app.innerHTML = `
  <div class="hud">
    <div class="title">Survivor Adventure</div>
    <div class="mission">Missão: encontrar 5 pedras de poder</div>
    <div class="stats">
      <span id="count">0 / 5</span>
    </div>
  </div>
  <div id="message" class="message hidden"></div>
`;

const countEl = document.getElementById('count') as HTMLSpanElement;
const messageEl = document.getElementById('message') as HTMLDivElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecae6);
scene.fog = new THREE.Fog(0x8ecae6, 20, 80);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
camera.position.set(0, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x234d2d, 1.4);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfff2cc, 1.3);
sun.position.set(8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x3f8f4d, roughness: 0.95 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const playerRoot = new THREE.Group();
scene.add(playerRoot);

const playerBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 1.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x2d6cdf }),
);
playerBody.position.y = 1.4;
playerBody.castShadow = true;
playerRoot.add(playerBody);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0xf3c9a9 }),
);
head.position.y = 2.7;
head.castShadow = true;
playerRoot.add(head);

const weapon = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 1.4, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x111111 }),
);
weapon.position.set(0.9, 1.7, 0.1);
weapon.rotation.z = -0.6;
playerRoot.add(weapon);

const player = {
  group: playerRoot,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(0, 0, 1),
  radius: 1.2,
  speed: 10,
  jumpForce: 8,
  onGround: true,
  attackCooldown: 0,
  collected: 0,
};

player.group.position.set(0, 0, 10);

const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (event) => {
  keys[event.code] = true;

  if (event.code === 'Space' && player.onGround) {
    player.velocity.y = player.jumpForce;
    player.onGround = false;
  }

  if (event.code === 'KeyE') {
    performAttack();
  }
});
window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});
window.addEventListener('pointerdown', () => {
  performAttack();
});

const treePositions = [
  [-12, -6],
  [-18, 10],
  [15, 8],
  [20, -12],
  [-5, 22],
  [8, -20],
  [26, 18],
  [-24, -18],
  [0, -12],
  [14, 24],
];

for (const [x, z] of treePositions) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a4d2a }),
  );
  trunk.position.set(x, 1.5, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  world.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0x3d8f43, roughness: 0.9 }),
  );
  leaves.position.set(x, 4.2, z);
  leaves.castShadow = true;
  world.add(leaves);
}

const rocks = [
  [-7, -20],
  [18, -4],
  [-22, 12],
  [24, 12],
  [-12, 20],
  [9, -2],
];

for (const [x, z] of rocks) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.2, 0),
    new THREE.MeshStandardMaterial({ color: 0x8a8f97 }),
  );
  rock.position.set(x, 1.1, z);
  rock.scale.set(1.4, 1.2, 1.1);
  rock.castShadow = true;
  rock.receiveShadow = true;
  world.add(rock);
}

const totalCrystals = 5;
const crystals: THREE.Group[] = [];

function createCrystal(position: THREE.Vector3) {
  const crystalGroup = new THREE.Group();
  const crystalMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7, 0),
    new THREE.MeshStandardMaterial({
      color: 0x8a2be2,
      emissive: 0x4c1d95,
      emissiveIntensity: 1.2,
      metalness: 0.2,
      roughness: 0.2,
    }),
  );
  crystalMesh.castShadow = true;
  crystalMesh.position.y = 1.2;
  crystalGroup.add(crystalMesh);

  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.08, 12, 40),
    new THREE.MeshBasicMaterial({ color: 0xe9a8ff, transparent: true, opacity: 0.7 }),
  );
  glow.rotation.x = Math.PI / 2;
  crystalGroup.add(glow);

  crystalGroup.position.copy(position);
  crystalGroup.userData = { bob: Math.random() * Math.PI * 2 };
  scene.add(crystalGroup);
  crystals.push(crystalGroup);
}

const crystalSpawns = [
  new THREE.Vector3(-18, 0, -8),
  new THREE.Vector3(14, 0, 18),
  new THREE.Vector3(-10, 0, 20),
  new THREE.Vector3(22, 0, -16),
  new THREE.Vector3(-24, 0, 2),
];

for (const spawn of crystalSpawns) {
  createCrystal(spawn);
}

const portal = new THREE.Group();
const portalBody = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.4, 0.8, 32),
  new THREE.MeshStandardMaterial({
    color: 0x232a36,
    emissive: 0x2d4d6d,
    emissiveIntensity: 0.7,
    metalness: 0.6,
    roughness: 0.3,
  }),
);
portalBody.position.y = 0.8;
portalBody.castShadow = true;
portal.add(portalBody);

const portalRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.1, 0.18, 16, 60),
  new THREE.MeshBasicMaterial({ color: 0x7dd3fc }),
);
portalRing.rotation.x = Math.PI / 2;
portalRing.position.y = 2.4;
portal.add(portalRing);

portal.position.set(0, 0, -30);
scene.add(portal);

const enemy = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 2.2, 1.6),
  new THREE.MeshStandardMaterial({ color: 0x9b2c2c }),
);
enemy.position.set(10, 1.1, -8);
enemy.castShadow = true;
scene.add(enemy);

enemy.userData = {
  health: 40,
  direction: new THREE.Vector3(1, 0, 0),
};

const hudCount = document.getElementById('count') as HTMLSpanElement;
const message = document.getElementById('message') as HTMLDivElement;

function showMessage(text: string) {
  message.textContent = text;
  message.classList.remove('hidden');
  message.classList.add('show');
}

function hideMessage() {
  message.classList.add('hidden');
  message.classList.remove('show');
}

function performAttack() {
  if (player.attackCooldown > 0) return;

  player.attackCooldown = 0.5;

  const attackRange = 3.2;
  const toEnemy = enemy.position.clone().sub(player.group.position);
  const distance = toEnemy.length();

  if (distance < attackRange) {
    enemy.userData.health -= 25;
    enemy.position.add(toEnemy.normalize().multiplyScalar(0.6));

    if (enemy.userData.health <= 0) {
      enemy.visible = false;
      showMessage('Inimigo derrotado!');
      setTimeout(hideMessage, 900);
    }
  }
}

function collectCrystal() {
  for (let i = crystals.length - 1; i >= 0; i--) {
    const crystal = crystals[i];
    if (!crystal.visible) continue;

    const distance = crystal.position.distanceTo(player.group.position);
    if (distance < 1.8) {
      crystal.visible = false;
      player.collected += 1;
      hudCount.textContent = `${player.collected} / ${totalCrystals}`;

      if (player.collected === totalCrystals) {
        portalRing.material = new THREE.MeshBasicMaterial({ color: 0x7ef29a });
        showMessage('Portal liberado!');
      } else {
        showMessage('Pedra coletada!');
      }

      setTimeout(hideMessage, 900);
    }
  }
}

function updatePlayer(delta: number) {
  const move = new THREE.Vector3();
  if (keys.KeyW || keys.ArrowUp) move.z -= 1;
  if (keys.KeyS || keys.ArrowDown) move.z += 1;
  if (keys.KeyA || keys.ArrowLeft) move.x -= 1;
  if (keys.KeyD || keys.ArrowRight) move.x += 1;

  if (move.lengthSq() > 0) {
    move.normalize();
    player.direction.copy(move);
    const yaw = Math.atan2(move.x, move.z);
    player.group.rotation.y = yaw;
  }

  const velocity = new THREE.Vector3();
  velocity.copy(move).multiplyScalar(player.speed * delta);
  player.group.position.add(velocity);

  player.group.position.x = THREE.MathUtils.clamp(player.group.position.x, -34, 34);
  player.group.position.z = THREE.MathUtils.clamp(player.group.position.z, -34, 34);

  player.velocity.y -= 18 * delta;
  player.group.position.y += player.velocity.y * delta;

  if (player.group.position.y <= 0) {
    player.group.position.y = 0;
    player.velocity.y = 0;
    player.onGround = true;
  }

  if (player.group.position.y > 0) {
    player.onGround = false;
  }

  player.attackCooldown = Math.max(0, player.attackCooldown - delta);
  collectCrystal();

  if (player.collected >= totalCrystals) {
    const distanceToPortal = player.group.position.distanceTo(portal.position);
    if (distanceToPortal < 3.5) {
      showMessage('Missão concluída!');
      setTimeout(() => {
        showMessage('Jake escapou do mundo do jogo.');
      }, 1200);
      player.speed = 0;
    }
  }
}

function updateEnemy(delta: number) {
  if (!enemy.visible) return;

  const offset = player.group.position.clone().sub(enemy.position);
  const distance = offset.length();

  if (distance < 20) {
    offset.normalize();
    enemy.position.x += offset.x * 1.5 * delta;
    enemy.position.z += offset.z * 1.5 * delta;
    enemy.rotation.y = Math.atan2(offset.x, offset.z);

    if (distance < 2.2) {
      player.group.position.add(offset.multiplyScalar(-0.5 * delta));
      player.group.position.x = THREE.MathUtils.clamp(player.group.position.x, -34, 34);
      player.group.position.z = THREE.MathUtils.clamp(player.group.position.z, -34, 34);
    }
  }
}

function updateCrystals() {
  for (const crystal of crystals) {
    if (!crystal.visible) continue;
    crystal.rotation.y += 0.04;
    crystal.position.y = 1.2 + Math.sin(performance.now() * 0.004 + crystal.userData.bob) * 0.6;
  }
}

function updatePortal() {
  const active = player.collected >= totalCrystals;
  portalRing.material.opacity = active ? 1 : 0.2;
  portalRing.scale.setScalar(active ? 1 : 0.7);
  portalBody.material.emissiveIntensity = active ? 1.5 : 0.6;
}

function animate() {
  const delta = Math.min(0.033, clock.getDelta());
  updatePlayer(delta);
  updateEnemy(delta);
  updateCrystals();
  updatePortal();

  const desiredCamera = new THREE.Vector3(
    player.group.position.x,
    player.group.position.y + 5.5,
    player.group.position.z + 8,
  );
  camera.position.lerp(desiredCamera, 0.08);
  camera.lookAt(player.group.position.x, 1.5, player.group.position.z);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

const clock = new THREE.Clock();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
