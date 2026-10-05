import { groundHeight, fallSpeed } from "./simulation.js";

const status = document.querySelector("#status");
function refreshSteppers() {
  for (const id of ["breeze", "wing", "weight", "speed"]) {
    const input = document.getElementById(id),
      value = Number(input.value);
    let text =
      id === "breeze"
        ? Math.round(value * 100) + "%"
        : id === "speed"
          ? value.toFixed(1) + "×"
          : id === "wing"
            ? value < 0.8
              ? "Small"
              : value > 1.3
                ? "Large"
                : "Medium"
            : value < 0.4
              ? "Light"
              : value > 0.7
                ? "Heavy"
                : "Medium";
    if (id === "wing" || id === "weight")
      text +=
        " · " +
        (Math.round((value - Number(input.min)) / Number(input.step)) + 1);
    document.getElementById(id + "State").textContent = input.disabled
      ? "Auto"
      : text;
    document
      .querySelectorAll('[data-control="' + id + '"]')
      .forEach(
        (button) =>
          (button.disabled =
            input.disabled ||
            (Number(button.dataset.direction) < 0
              ? value <= Number(input.min)
              : value >= Number(input.max))),
      );
  }
}
for (const button of document.querySelectorAll("[data-control]"))
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.control);
    if (input.disabled) return;
    input.value = Math.max(
      Number(input.min),
      Math.min(
        Number(input.max),
        Number(
          (
            Number(input.value) +
            Number(button.dataset.direction) * Number(input.step)
          ).toFixed(2),
        ),
      ),
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
    refreshSteppers();
  });
refreshSteppers();
try {
  const THREE = await import(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
  );
  const canvas = document.querySelector("#garden");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#c9e3e8");
  scene.fog = new THREE.Fog("#c9e3e8", 55, 110);
  const camera = new THREE.OrthographicCamera();
  const target = new THREE.Vector3(0, 2, 0);
  const mat = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 });
  const grass = mat("#a7c67b"),
    wood = mat("#d5b88e"),
    bark = mat("#8f6948");
  function mesh(geometry, material, x, y, z, parent = scene) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  scene.add(new THREE.HemisphereLight("#fff9e6", "#71925c", 2));
  const sun = new THREE.DirectionalLight("#fff1cf", 3.5);
  sun.position.set(-8, 15, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -16,
    right: 16,
    top: 14,
    bottom: -14,
    near: 1,
    far: 40,
  });
  sun.shadow.normalBias = 0.04;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 4;
  scene.add(sun);
  // One continuous world: flat play space rises into distant rolling hills.
  const terrainGeometry = new THREE.PlaneGeometry(120, 70, 160, 110);
  terrainGeometry.rotateX(-Math.PI / 2);
  const terrainPositions = terrainGeometry.attributes.position;
  const terrainColors = [];
  const nearColor = new THREE.Color("#93b66a"),
    meadowColor = new THREE.Color("#a7c67b"),
    farColor = new THREE.Color("#91b17a");
  for (let i = 0; i < terrainPositions.count; i++) {
    const x = terrainPositions.getX(i),
      z = terrainPositions.getZ(i) - 15;
    const height = groundHeight(x, z) + 0.025;
    terrainPositions.setXYZ(i, x, height - 0.025, z);
    const color =
      z > 1
        ? nearColor.clone()
        : meadowColor
            .clone()
            .lerp(farColor, Math.min(1, Math.max(0, (-z - 8) / 25)));
    terrainColors.push(color.r, color.g, color.b);
  }
  terrainGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(terrainColors, 3),
  );
  terrainGeometry.computeVertexNormals();
  const terrain = mesh(
    terrainGeometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    0,
    0,
    0,
  );
  terrain.castShadow = false;
  function beam(a, b, r, material, parent = scene) {
    const v = new THREE.Vector3().subVectors(b, a);
    const m = mesh(
      new THREE.CylinderGeometry(r * 0.85, r, v.length(), 12),
      material,
      0,
      0,
      0,
      parent,
    );
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    return m;
  }
  // Sun and clouds are distant world objects, using ordinary depth testing.
  const sunDisc = mesh(
    new THREE.SphereGeometry(0.65, 24, 20),
    new THREE.MeshBasicMaterial({ color: "#ffe5a0", fog: false }),
    8,
    6,
    -20,
  );
  sunDisc.castShadow = false;
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: "#fff8e9",
    roughness: 1,
    fog: false,
  });
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    scene.add(cloud);
    for (const [x, y, r] of [
      [-0.65, 0, 0.55],
      [0, 0.2, 0.75],
      [0.7, 0, 0.5],
    ]) {
      const puff = mesh(
        new THREE.SphereGeometry(r, 20, 14),
        cloudMaterial,
        x,
        y,
        0,
        cloud,
      );
      puff.scale.set(1.3, 0.65, 0.65);
      puff.castShadow = false;
    }
    clouds.push(cloud);
  }
  // Translucent curved wind ribbons traverse the same world as the seeds.
  const windRibbons = [];
  for (let i = 0; i < 18; i++) {
    const points = [];
    for (let j = 0; j < 14; j++)
      points.push(new THREE.Vector3(j * 0.16, Math.sin(j * 0.4) * 0.06, 0));
    const path = new THREE.CatmullRomCurve3(points);
    const ribbon = new THREE.Mesh(
      new THREE.TubeGeometry(path, 20, 0.025, 5, false),
      new THREE.MeshBasicMaterial({
        color: "#72b6df",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    ribbon.position.set(
      -9 + (i % 6) * 3,
      1.8 + (i % 4) * 0.8,
      2 - (i % 5) * 1.3,
    );
    scene.add(ribbon);
    windRibbons.push(ribbon);
  }
  // Rounded fence rails, extending behind the tree across the full world.
  for (const y of [0.45, 0.95])
    beam(
      new THREE.Vector3(-15, y, -1),
      new THREE.Vector3(15, y, -1),
      0.075,
      wood,
    );
  for (let x = -15; x <= 15; x += 1.5) {
    mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 10), wood, x, 0.7, -1);
    mesh(new THREE.SphereGeometry(0.095, 12, 8), wood, x, 1.4, -1);
  }
  const tree = new THREE.Group();
  tree.position.set(-4, 0, 3.1);
  scene.add(tree);
  mesh(new THREE.CylinderGeometry(0.27, 0.52, 4.3, 16), bark, 0, 2.15, 0, tree);
  beam(
    new THREE.Vector3(0, 3.1, 0),
    new THREE.Vector3(2.2, 4.8, 0.15),
    0.14,
    bark,
    tree,
  );
  beam(
    new THREE.Vector3(0, 3.4, 0),
    new THREE.Vector3(-1.5, 4.7, -0.4),
    0.17,
    bark,
    tree,
  );
  const canopy = new THREE.Group();
  tree.add(canopy);
  const foliage = ["#92af6c", "#a5bd7e", "#7d9d5b", "#b3c78b"].map(mat);
  const canopyMaterials = ["#437e64", "#60967b", "#366c56", "#77a58a"].map(mat);
  // Dense overlapping domes restore a soft, continuous canopy silhouette.
  const domeGeometry = new THREE.SphereGeometry(1, 32, 24);
  const clusters = [
    [-1.1, 4.65, 0.25, 1.1],
    [0, 4.8, 0.6, 1.25],
    [1.05, 4.95, -0.3, 1.05],
    [-0.65, 5.65, -0.35, 1.2],
    [0.55, 5.75, 0.25, 1.15],
    [-0.15, 6.25, -0.15, 0.95],
  ];
  for (let i = 0; i < clusters.length; i++) {
    const [x, y, z, r] = clusters[i];
    const cluster = mesh(domeGeometry, canopyMaterials[i % 4], x, y, z, canopy);
    cluster.scale.set(r, r * 0.78, r * 0.9);
  }
  // Leaves at the exposed branch tip.
  for (let i = 0; i < 5; i++) {
    const leaf = mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      foliage[i % 4],
      1.8 + i * 0.16,
      4.6 + i * 0.08,
      0.2 + (i % 2) * 0.25,
      tree,
    );
    leaf.scale.set(0.55, 1.5, 0.22);
    leaf.rotation.z = i % 2 ? 0.8 : -0.8;
  }
  // Reusable airborne leaves, released by stronger gusts.
  const looseLeaves = [];
  const looseGeometry = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 24; i++) {
    const leaf = mesh(looseGeometry, foliage[i % 4], 0, 0, 0);
    leaf.scale.set(0.16, 0.045, 0.08);
    leaf.visible = false;
    leaf.castShadow = false;
    looseLeaves.push({ mesh: leaf, age: 0, active: false, spin: 2 + (i % 5) });
  }
  let leafRelease = 0;
  // Shared instanced grass: hundreds of tufts without hundreds of draw calls.
  let rng = 1327;
  function random() {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  }
  const blade = new THREE.Shape();
  blade.moveTo(-0.04, 0);
  blade.quadraticCurveTo(-0.035, 0.18, 0.06, 0.28);
  blade.quadraticCurveTo(0.015, 0.12, 0.04, 0);
  blade.closePath();
  const tuftGeometry = new THREE.ShapeGeometry(blade, 5);
  const tufts = new THREE.InstancedMesh(
    tuftGeometry,
    new THREE.MeshStandardMaterial({
      color: "#769b50",
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    1600,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 1600; i++) {
    const x = (random() - 0.5) * 36,
      z = (random() - 0.5) * 30;
    dummy.position.set(x, groundHeight(x, z) + 0.025, z);
    dummy.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.35);
    dummy.scale.setScalar(0.5 + random());
    dummy.updateMatrix();
    tufts.setMatrixAt(i, dummy.matrix);
  }
  tufts.receiveShadow = true;
  scene.add(tufts);
  // Small flower patches and low plants leave the seed corridor open.
  const flowerColors = ["#f6d275", "#fff4db", "#d997ad"].map(mat);
  for (let i = 0; i < 34; i++) {
    const x = -11 + random() * 22,
      z = -7 + random() * 14;
    if (Math.abs(z + 1) < 0.8 || (x > -3 && x < 4 && z > 0 && z < 4.5))
      continue;
    const stalkHeight = 0.18 + random() * 0.15;
    beam(
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x, stalkHeight, z),
      0.015,
      foliage[2],
    );
    for (let petal = 0; petal < 5; petal++) {
      const angle = (petal * Math.PI * 2) / 5;
      const m = mesh(
        new THREE.SphereGeometry(0.055, 10, 8),
        flowerColors[i % 3],
        x + Math.cos(angle) * 0.06,
        stalkHeight,
        z + Math.sin(angle) * 0.06,
      );
      m.scale.y = 0.45;
    }
    mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      mat("#d9a13e"),
      x,
      stalkHeight + 0.02,
      z,
    );
  }
  for (const [x, z] of [
    [-6, 3],
    [-5, -3],
    [5, 5],
    [8, -4],
    [-8, -5],
    [9, 3],
  ]) {
    for (let j = 0; j < 5; j++) {
      const angle = (j * Math.PI * 2) / 5;
      const leaf = mesh(
        new THREE.SphereGeometry(0.2, 12, 10),
        foliage[j % 4],
        x + Math.sin(angle) * 0.18,
        0.16,
        z + Math.cos(angle) * 0.18,
      );
      leaf.scale.set(0.5, 1.5, 0.25);
      leaf.rotation.set(Math.cos(angle) * 0.7, angle, Math.sin(angle) * 0.7);
    }
  }
  // A few growing saplings anchor the far meadow's scale.
  for (const [x, z] of [
    [1, -3],
    [4, -5],
    [6, -2.8],
  ]) {
    beam(
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x, 0.55, z),
      0.035,
      foliage[2],
    );
    for (const side of [-1, 1]) {
      const l = mesh(
        new THREE.SphereGeometry(0.19, 16, 12),
        foliage[1],
        x + side * 0.14,
        0.46,
        z,
      );
      l.scale.set(1.2, 0.4, 0.65);
      l.rotation.z = side * 0.4;
    }
  }
  // Two original clay-style chickens: lanky Peck and round, speckled Dot.
  function chicken(name, x, z, round) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    const cream = mat(round ? "#d6a06a" : "#f5e6c4"),
      orange = mat("#c58a3d"),
      red = mat("#bc5344");
    const ball = (px, py, pz, sx, sy, sz, material, parent = group) => {
      const m = mesh(
        new THREE.SphereGeometry(1, 20, 16),
        material,
        px,
        py,
        pz,
        parent,
      );
      m.scale.set(sx, sy, sz);
      return m;
    };
    const height = round ? 1.05 : 1.35;
    ball(
      0,
      round ? 0.55 : 0.4,
      0,
      round ? 0.55 : 0.29,
      round ? 0.52 : 0.37,
      round ? 0.46 : 0.32,
      cream,
    );
    beam(
      new THREE.Vector3(0, 0.65, 0),
      new THREE.Vector3(0, height, 0.025),
      round ? 0.12 : 0.1,
      cream,
      group,
    );
    const head = new THREE.Group();
    head.position.set(0, height, 0.04);
    group.add(head);
    ball(0, 0, 0, 0.21, 0.24, 0.21, cream, head);
    for (const side of [-1, 1]) {
      ball(side * 0.115, 0.055, 0.16, 0.088, 0.11, 0.055, mat("#fffaf1"), head);
      ball(
        side * 0.115,
        0.07,
        0.206,
        0.036,
        0.045,
        0.015,
        mat("#342b25"),
        head,
      );
      const brow = ball(
        side * 0.115,
        0.175,
        0.18,
        0.1,
        0.021,
        0.027,
        mat("#805c3b"),
        head,
      );
      brow.rotation.z = side * (round ? 0.15 : -0.18);
    }
    const beak = mesh(
      new THREE.ConeGeometry(0.095, 0.22, 5),
      orange,
      0,
      -0.055,
      0.265,
      head,
    );
    beak.rotation.x = Math.PI / 2;
    ball(0, -0.18, 0.12, 0.06, 0.095, 0.055, red, head);
    for (let i = 0; i < 3; i++)
      ball(
        0,
        0.22 + i * 0.015,
        (i - 1) * 0.075,
        0.055,
        0.075,
        0.065,
        red,
        head,
      );
    const wings = [];
    for (const side of [-1, 1]) {
      const w = ball(
        side * (round ? 0.5 : 0.27),
        round ? 0.55 : 0.46,
        0,
        0.085,
        0.23,
        0.24,
        cream,
      );
      w.rotation.z = side * 0.2;
      wings.push(w);
    }
    for (let i = 0; i < 3; i++) {
      const tail = ball((i - 1) * 0.065, 0.78, -0.28, 0.06, 0.22, 0.1, cream);
      tail.rotation.x = -0.55;
    }
    if (round) {
      const spots = mat("#ad794b");
      for (let i = 0; i < 9; i++) {
        const angle = i * 2.4;
        ball(
          Math.cos(angle) * 0.51,
          0.45 + (i % 3) * 0.14,
          Math.sin(angle) * 0.43,
          0.036,
          0.047,
          0.027,
          spots,
        );
      }
    }
    group.rotation.y = round ? -0.3 : 0.35;
    return {
      group,
      head,
      wings,
      x,
      z,
      height,
      name,
      vx: 0,
      vz: 0,
      mode: "idle",
      timer: 0,
      cooldown: 0,
      heading: group.rotation.y,
    };
  }
  const chickens = [
    chicken("Peck", -2.8, 3.3, false),
    chicken("Dot", -0.7, 3.7, true),
  ];
  // A single curved papery wing attached to a heavier seed body.
  const seed = new THREE.Group();
  scene.add(seed);
  const rotor = new THREE.Group();
  seed.add(rotor);
  const seedBody = mesh(
    new THREE.SphereGeometry(0.12, 20, 16),
    mat("#9c6336"),
    0,
    0,
    0,
    rotor,
  );
  const shape = new THREE.Shape();
  shape.moveTo(0.03, 0);
  shape.bezierCurveTo(0.25, 0.2, 0.7, 0.29, 1.05, 0.13);
  shape.bezierCurveTo(0.82, -0.08, 0.3, -0.1, 0.03, 0);
  const wingGeometry = new THREE.ShapeGeometry(shape, 24);
  // Curve the wing slightly out of its plane, rather than a flat card.
  const positions = wingGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    positions.setZ(i, Math.sin(x * Math.PI) * 0.055);
  }
  wingGeometry.computeVertexNormals();
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: "#e7ba79",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const wing = mesh(wingGeometry, wingMaterial, 0, 0, 0, rotor);
  wing.rotation.x = -Math.PI / 2;
  seedBody.name = "body";
  wing.name = "wing";
  const veins = new THREE.Group();
  veins.name = "veins";
  veins.rotation.x = -Math.PI / 2;
  rotor.add(veins);
  const veinMaterial = new THREE.LineBasicMaterial({
    color: "#b9874d",
    transparent: true,
    opacity: 0.5,
  });
  for (let i = 0; i < 6; i++) {
    const x = 0.12 + i * 0.13;
    const points = [
      new THREE.Vector3(0.04, 0, 0.003),
      new THREE.Vector3(x, 0.025, Math.sin(x * Math.PI) * 0.055 + 0.003),
      new THREE.Vector3(
        x + 0.13,
        0.12,
        Math.sin((x + 0.13) * Math.PI) * 0.055 + 0.003,
      ),
    ];
    veins.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        veinMaterial,
      ),
    );
  }
  let flight = null,
    flights = [],
    landed = [],
    plants = [],
    playing = false,
    left = 10,
    planted = 0,
    eaten = 0,
    dropTimer = 0,
    pairIndex = 0,
    windTimer = 0,
    windX = 0,
    windZ = 0,
    targetX = 0,
    targetZ = 0;
  const autoControl = document.querySelector("#auto"),
    score = document.querySelector("#score");
  function scores() {
    score.textContent = `Meadow ${planted} · Chickens ${eaten} · Left ${left}`;
  }
  function syncControls() {
    wingControl.disabled =
      weightControl.disabled =
      document.querySelector("#breeze").disabled =
        autoControl.checked;
    document.querySelector("#drop").disabled =
      autoControl.checked || (playing && left === 0);
    document.querySelector("#dropPair").disabled =
      autoControl.checked || (playing && left < 2);
    refreshSteppers();
  }
  function plant(x, z) {
    const sprout = new THREE.Group();
    sprout.position.set(x, groundHeight(x, z) + 0.035, z);
    scene.add(sprout);
    plants.push(sprout);
    sprout.userData.growth = 0;
    sprout.scale.setScalar(0.05);
    beam(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.85, 0),
      0.045,
      foliage[2],
      sprout,
    );
    for (const side of [-1, 1]) {
      const l = mesh(
        new THREE.SphereGeometry(0.28, 16, 12),
        foliage[1],
        side * 0.22,
        0.67,
        0,
        sprout,
      );
      l.scale.set(1.2, 0.4, 0.7);
      l.rotation.z = side * 0.4;
    }
  }
  function randomReleasePoint() {
    // Sample the lower canopy and exposed branch, relative to the tree.
    const points = [
      [-1.25, 4.3, 0.4],
      [-0.7, 4.25, 0.9],
      [0.15, 4.35, 0.9],
      [1.15, 4.55, 0.25],
      [2.05, 4.75, 0.15],
    ];
    const p = points[Math.floor(Math.random() * points.length)];
    return new THREE.Vector3(
      tree.position.x + p[0] + (Math.random() - 0.5) * 0.3,
      p[1] + (Math.random() - 0.5) * 0.18,
      tree.position.z + p[2] + (Math.random() - 0.5) * 0.3,
    );
  }
  function release(size, weight, offset = 0, origin = randomReleasePoint()) {
    if (left <= 0) return;
    seedDesign();
    const model = seed.clone(true);
    scene.add(model);
    model.visible = true;
    model.position.copy(origin);
    model.position.x += offset;
    model.getObjectByName("wing").scale.x = size;
    model.getObjectByName("veins").scale.x = size;
    model
      .getObjectByName("body")
      .scale.set(1 + weight, 0.8 + weight * 0.5, 1 + weight);
    flights.push({
      mesh: model,
      rotor: model.children[0],
      age: 0,
      wing: size,
      weight,
    });
    seed.visible = false;
    left--;
    scores();
    syncControls();
  }
  function startRound() {
    document.querySelector("#round .button-label").textContent =
      "Restart round";
    for (const f of [...flights, ...landed]) scene.remove(f.mesh);
    for (const p of plants) scene.remove(p);
    flights = [];
    landed = [];
    plants = [];
    flight = null;
    left = 10;
    planted = eaten = pairIndex = 0;
    for (const h of chickens) {
      h.mode = "idle";
      h.timer = h.cooldown = h.vx = h.vz = 0;
      h.head.position.y = h.height;
      h.group.position.set(h.x, 0, h.z);
      h.group.rotation.z = 0;
    }
    windX = windZ = targetX = targetZ = 0;
    playing = true;
    dropTimer = 0.5;
    windTimer = 0;
    seed.visible = false;
    scores();
    syncControls();
    status.textContent = "Help seeds find room to grow beyond the fence.";
  }

  const wingControl = document.querySelector("#wing"),
    weightControl = document.querySelector("#weight"),
    speedControl = document.querySelector("#speed");
  speedControl.oninput = refreshSteppers;
  function seedDesign() {
    const size = +wingControl.value,
      weight = +weightControl.value;
    wing.scale.set(size, 1, 1);
    veins.scale.set(size, 1, 1);
    seedBody.scale.set(1 + weight, 0.8 + weight * 0.5, 1 + weight);
  }
  function resetSeed() {
    seedDesign();
    seed.position.set(-1.8, 4.8, 3.25);
    rotor.rotation.set(0.18, 0, 0.1);
    flight = null;
  }
  wingControl.oninput = weightControl.oninput = () => {
    if (!flight) seedDesign();
  };
  document.querySelector("#drop").onclick = () => {
    if (!playing) startRound();
    release(+wingControl.value, +weightControl.value);
  };
  document.querySelector("#dropPair").onclick = () => {
    if (autoControl.checked) return;
    if (!playing) startRound();
    if (left < 2) return;
    const origin = randomReleasePoint(),
      size = +wingControl.value;
    release(size, 0.1, -0.2, origin);
    release(size, 0.9, 0.2, origin);
    dropTimer = 6;
    status.textContent =
      "Same wing, same height: one light seed and one heavy seed. Which stays up longer?";
  };
  document.querySelector("#round").onclick = startRound;
  autoControl.checked = false;
  autoControl.onclick = () => {
    autoControl.checked = !autoControl.checked;
    autoControl.setAttribute("aria-pressed", String(autoControl.checked));
    autoControl.querySelector(".button-label").textContent =
      "Autoplay: " + (autoControl.checked ? "on" : "off");
    syncControls();
    windTimer = 0;
  };
  resetSeed();
  let previousTime = null;

  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      aspect = w / h,
      span = Math.max(13, 19 / aspect);
    camera.left = (-span * aspect) / 2;
    camera.right = (span * aspect) / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.near = 0.1;
    camera.far = 180;
    camera.position.set(0, 7, 24);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    renderer.setSize(w, h, false);
    // Place distant objects within the intended sky composition, in world coordinates.
    function skyPosition(nx, ny, depth = -24) {
      const point = new THREE.Vector3(nx, ny, 0).unproject(camera);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      return point.addScaledVector(direction, (depth - point.z) / direction.z);
    }
    sunDisc.position.copy(skyPosition(0.85, 0.84, -36));
    clouds.forEach((cloud, i) => {
      cloud.position.copy(
        skyPosition(
          i < 4 ? -0.65 + i * 0.39 : -1.35 - (i - 4) * 0.5,
          0.78 - (i % 2) * 0.09,
        ),
      );
      cloud.userData.homeX = cloud.position.x;
    });
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setAnimationLoop((ms) => {
    const t = ms / 1000;
    const dt =
      previousTime === null
        ? 0
        : Math.min(0.05, (ms - previousTime) / 1000) * +speedControl.value;
    previousTime = ms;
    if (playing) {
      if (autoControl.checked) {
        windTimer -= dt;
        if (windTimer <= 0) {
          const strength = Math.random();
          targetZ = (Math.random() < 0.85 ? -1 : 1) * strength;
          targetX = strength * (1.1 + Math.random() * 0.35);
          windTimer = 3 + Math.random() * 4;
        }
      } else {
        targetZ = -Number(document.querySelector("#breeze").value);
        targetX = -targetZ * 1.2;
      }
      windX += (targetX - windX) * Math.min(1, dt * 3);
      windZ += (targetZ - windZ) * Math.min(1, dt * 3);
      dropTimer -= dt;
      if (dropTimer <= 0 && left > 0) {
        if (autoControl.checked) {
          const size = 0.65 + Math.random() * 0.9,
            weight = 0.2 + Math.random() * 0.4,
            origin = randomReleasePoint();
          if (pairIndex++ % 2 === 0) {
            release(size, 0.1, -0.2, origin);
            release(size, 0.9, 0.2, origin);
          } else {
            release(0.5, weight, -0.2, origin);
            release(1.8, weight, 0.2, origin);
          }
        } else release(+wingControl.value, +weightControl.value);
        dropTimer = autoControl.checked ? 6 : 4;
      }
    }
    for (const f of flights) {
      f.age += dt;
      const caught = Math.min(1, Math.max(0, (f.age - 0.25) / 0.45));
      const fall = fallSpeed(f.weight, f.wing);
      f.rotor.rotation.y += dt * (2 + (caught * 18) / Math.sqrt(f.wing));
      f.mesh.rotation.z = Math.sin(f.age * 5) * 0.05 * (1 - caught);
      const previousZ = f.mesh.position.z;
      f.mesh.position.y -= dt * ((1 - caught) * 1.3 + caught * fall);
      f.mesh.position.z += (dt * windZ * 2.2 * caught) / (fall + 0.4);
      f.mesh.position.x += (dt * windX * 2.2 * caught) / (fall + 0.4);
      if (
        f.mesh.position.y < 1.4 &&
        (previousZ + 1) * (f.mesh.position.z + 1) < 0
      )
        f.mesh.position.z = previousZ > -1 ? -0.98 : -1.02;
      if (
        f.mesh.position.y <=
        groundHeight(f.mesh.position.x, f.mesh.position.z) + 0.15
      ) {
        f.mesh.position.y =
          groundHeight(f.mesh.position.x, f.mesh.position.z) + 0.15;
        f.done = true;
        // Settle away from the rails so the seed and pecking remain visible.
        if (Math.abs(f.mesh.position.z + 1) < 0.55)
          f.mesh.position.z = f.mesh.position.z < -1 ? -1.65 : -0.35;
        if (f.mesh.position.z < -1) {
          planted++;
          plant(f.mesh.position.x, f.mesh.position.z);
          scene.remove(f.mesh);
          status.textContent = "A seed found sunlight and room in the meadow!";
        } else {
          f.rotor.rotation.x = 0.08;
          landed.push(f);
        }
        scores();
      }
    }
    for (const sprout of plants) {
      sprout.userData.growth = Math.min(1, sprout.userData.growth + dt * 1.4);
      const g = sprout.userData.growth;
      sprout.scale.setScalar(0.05 + 0.95 * (1 - Math.pow(1 - g, 3)));
    }
    flights = flights.filter((f) => !f.done);
    flight = flights[0] || null;
    for (const f of landed) {
      const collector = chickens.find(
        (h) =>
          Math.hypot(
            h.group.position.x - f.mesh.position.x,
            h.group.position.z - f.mesh.position.z,
          ) < 0.65 &&
          h.mode !== "tumble" &&
          h.mode !== "bonk" &&
          h.mode !== "peck",
      );
      if (collector && !f.pecker) {
        f.pecker = collector;
        f.peckTime = 0.85;
        collector.mode = "peck";
        collector.timer = 0.85;
        collector.vx = collector.vz = 0;
      }
      if (f.pecker) {
        f.peckTime -= dt;
        if (f.peckTime <= 0) {
          scene.remove(f.mesh);
          f.collected = true;
          eaten++;
          scores();
          status.textContent =
            f.pecker.name + " pecked up a seed in the garden.";
        }
      }
    }
    landed = landed.filter((f) => !f.collected);
    if (playing && left === 0 && flights.length === 0 && landed.length === 0) {
      playing = false;
      syncControls();
      status.textContent = `${planted} seeds reached growing space. Restart with different breeze, wing size and seed weight conditions`;
    }
    // Movement and comedy run on the same slowed clock as the seed.
    for (let i = 0; i < chickens.length; i++) {
      const h = chickens[i],
        dot = i === 1,
        watching = flight !== null;
      h.cooldown = Math.max(0, h.cooldown - dt);
      h.timer = Math.max(0, h.timer - dt);
      if (h.mode === "peck") {
        const food = landed.find((f) => f.pecker === h);
        if (food) {
          h.group.rotation.y = Math.atan2(
            food.mesh.position.x - h.group.position.x,
            food.mesh.position.z - h.group.position.z,
          );
        }
        h.head.rotation.x = 0.9 + Math.abs(Math.sin(h.timer * 18)) * 0.45;
        h.head.position.y =
          h.height - 0.18 - Math.abs(Math.sin(h.timer * 18)) * 0.12;
        if (h.timer <= 0) {
          h.mode = "idle";
          h.head.position.y = h.height;
          h.cooldown = 2;
        }
        continue;
      }
      if (h.mode === "tumble" || h.mode === "bonk") {
        const recovering = h.timer < 0.65;
        h.group.rotation.z +=
          ((recovering ? 0 : dot ? -0.7 : 1.35) - h.group.rotation.z) *
          Math.min(1, dt * 8);
        h.group.position.y = Math.max(0, h.group.position.y - dt * 0.6);
        h.head.rotation.x = Math.sin(t * 13) * 0.12;
        if (h.timer <= 0) {
          h.mode = "idle";
          h.cooldown = dot ? 4 : 3;
        }
        continue;
      }
      if (dot && watching && h.cooldown === 0 && h.mode !== "dash") {
        h.mode = "dash";
        h.timer = 1.3;
        h.cooldown = 5;
        // Alternate between an overeager chase and a detour into the tree.
        h.treeDash = !h.treeDash;
      }
      const dashing = h.mode === "dash";
      const meal = landed.find((f) => !f.pecker || f.pecker === h);
      let tx = meal
        ? meal.mesh.position.x
        : watching
          ? flight.mesh.position.x + (dot ? 0.55 : -0.35)
          : h.x;
      let tz = meal
        ? meal.mesh.position.z
        : watching
          ? Math.max(0.2, Math.min(4.5, flight.mesh.position.z + 0.7))
          : h.z;
      if (dashing && h.treeDash) {
        tx = -4;
        tz = 3.1;
      }
      const dx = tx - h.group.position.x,
        dz = tz - h.group.position.z,
        distance = Math.hypot(dx, dz);
      const pace = dashing ? 4.8 : dot ? 2.3 : 1.15;
      const desiredSpeed = Math.min(pace, distance * 2);
      const ease = Math.min(1, dt * (dashing ? 7 : 4));
      h.vx +=
        (distance > 0.05 ? (dx / distance) * desiredSpeed - h.vx : -h.vx) *
        ease;
      h.vz +=
        (distance > 0.05 ? (dz / distance) * desiredSpeed - h.vz : -h.vz) *
        ease;
      h.group.position.x += h.vx * dt;
      h.group.position.z += h.vz * dt;
      const speed = Math.hypot(h.vx, h.vz);
      const gaze = watching
        ? flight.mesh.position
        : new THREE.Vector3(tx, h.height, tz);
      const gx = gaze.x - h.group.position.x,
        gz = gaze.z - h.group.position.z;
      const lookYaw = Math.atan2(gx, gz);
      const bodyYaw = speed > 0.15 ? Math.atan2(h.vx, h.vz) : lookYaw;
      const turn = Math.atan2(
        Math.sin(bodyYaw - h.heading),
        Math.cos(bodyYaw - h.heading),
      );
      h.heading += turn * Math.min(1, dt * 7);
      h.group.rotation.y = h.heading;
      const headYaw = Math.atan2(
        Math.sin(lookYaw - h.heading),
        Math.cos(lookYaw - h.heading),
      );
      h.head.rotation.y = Math.max(-0.9, Math.min(0.9, headYaw));
      h.head.rotation.x = watching
        ? -Math.atan2(gaze.y - h.height, Math.max(0.2, Math.hypot(gx, gz)))
        : 0;
      const step = flight ? flight.age : t * +speedControl.value;
      h.group.position.y =
        speed > 0.15
          ? Math.abs(Math.sin(step * (dot ? 12 : 8))) *
            Math.min(0.12, speed * 0.035)
          : 0;
      h.group.rotation.z +=
        (Math.max(-0.18, Math.min(0.18, -turn * 0.12)) - h.group.rotation.z) *
        Math.min(1, dt * 6);
      h.wings.forEach(
        (w, j) =>
          (w.rotation.z =
            (j ? 1 : -1) *
            (0.2 +
              (dashing ? Math.abs(Math.sin(step * 18)) * 0.8 : speed * 0.06))),
      );
      if (
        dashing &&
        Math.hypot(h.group.position.x + 4, h.group.position.z - 3.1) < 0.58
      ) {
        h.mode = "bonk";
        h.timer = 1.5;
        h.vx = h.vz = 0;
        // Put Dot just outside the trunk before her dazed recovery.
        h.group.position.x = -3.4;
        status.textContent = "Dot: “Who put that tree there?”";
      } else if (dashing && h.timer <= 0) {
        h.mode = "idle";
      }
    }
    const peck = chickens[0],
      dot = chickens[1];
    const separation = new THREE.Vector2(
      dot.group.position.x - peck.group.position.x,
      dot.group.position.z - peck.group.position.z,
    );
    const gap = separation.length();
    if (gap < 0.8) {
      separation.setLength((0.8 - gap) * 0.5);
      if (gap < 0.001) separation.set(0.2, 0);
      dot.group.position.x += separation.x;
      dot.group.position.z += separation.y;
      peck.group.position.x -= separation.x;
      peck.group.position.z -= separation.y;
    }
    const windStrength = Math.hypot(windX, windZ);
    for (const cloud of clouds) {
      cloud.position.x += dt * (0.08 + windStrength * 1.35);
      const edge = camera.right + 2;
      if (cloud.position.x > edge)
        cloud.position.x = -edge - 1 - Math.random() * 2;
    }
    leafRelease += dt * Math.max(0, windStrength - 0.5) * 12;
    if (windStrength <= 0.5) leafRelease = 0;
    while (leafRelease >= 1) {
      leafRelease -= 1;
      const leaf = looseLeaves.find((l) => !l.active);
      if (!leaf) break;
      leaf.active = true;
      leaf.age = 0;
      leaf.mesh.visible = true;
      leaf.mesh.position.set(
        tree.position.x + (Math.random() - 0.5) * 2.5,
        4.5 + Math.random() * 1.6,
        tree.position.z + (Math.random() - 0.5),
      );
    }
    for (const leaf of looseLeaves) {
      if (!leaf.active) continue;
      leaf.age += dt;
      leaf.mesh.position.x += dt * (windX * 3 + Math.sin(leaf.age * 3) * 0.18);
      leaf.mesh.position.z += dt * windZ * 3;
      leaf.mesh.position.y -= dt * (0.25 + leaf.age * 0.06);
      leaf.mesh.rotation.x += dt * leaf.spin;
      leaf.mesh.rotation.z += dt * leaf.spin * 0.7;
      if (leaf.age > 10 || leaf.mesh.position.y < 0.08) {
        leaf.active = false;
        leaf.mesh.visible = false;
      }
    }
    for (let i = 0; i < windRibbons.length; i++) {
      const ribbon = windRibbons[i];
      ribbon.material.opacity =
        Math.min(0.85, 0.2 + windStrength * 0.8) *
        (windStrength > 0.03 ? 1 : 0);
      if (windStrength > 0.03) {
        ribbon.rotation.y = Math.atan2(-windZ, windX);
        ribbon.position.x += dt * windX * 4;
        ribbon.position.z += dt * windZ * 4;
        if (
          ribbon.position.z < -7 ||
          ribbon.position.z > 7 ||
          Math.abs(ribbon.position.x) > 12
        ) {
          ribbon.position.set(
            -8 + (i % 6) * 3,
            1.8 + (i % 4) * 0.8,
            windZ < 0 ? 6 : -6,
          );
        }
      }
    }
    const k = autoControl.checked
      ? Math.hypot(windX, windZ)
      : +document.querySelector("#breeze").value;
    canopy.rotation.z = reduced ? 0 : Math.sin(t * 1.4) * k * 0.025;
    canopy.rotation.x = reduced ? 0 : Math.cos(t * 1.1) * k * 0.012;
    renderer.render(scene, camera);
  });
  status.textContent = "Garden in front · sunny meadow beyond the fence";
} catch (error) {
  status.textContent =
    "The 3D garden could not load. Check your connection and WebGL support, then refresh.";
  console.error(error);
}
