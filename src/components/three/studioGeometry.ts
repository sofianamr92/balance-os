import * as THREE from 'three';
import type { Language } from '../../types/os';
import type { StudioNodeId, StudioNodeTelemetry } from '../../utils/studio3d';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePos: [number, number, number];
  offset: [number, number, number];
}

export interface InteractiveStudioNode {
  id: StudioNodeId;
  group: THREE.Group;
  screenMaterial?: THREE.MeshStandardMaterial;
  screenCanvas?: HTMLCanvasElement;
  screenTexture?: THREE.CanvasTexture;
  accentRing?: THREE.Mesh;
  baseWorldPos: THREE.Vector3;
}

export interface StudioSceneBundle {
  root: THREE.Group;
  nodes: Record<StudioNodeId, InteractiveStudioNode>;
  explodables: ExplodablePart[];
  floorMaterial: THREE.MeshStandardMaterial;
  coveMaterial: THREE.MeshStandardMaterial;
  softboxEmissiveMaterial: THREE.MeshStandardMaterial;
  studioAccentStripMaterial: THREE.MeshStandardMaterial;
  disposables: Array<{ dispose: () => void }>;
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function createExtrudedRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel = 0.025
): THREE.ExtrudeGeometry {
  const shape = createRoundedRectShape(width, depth, radius);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, height - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 124);
  grad.addColorStop(0, 'rgba(8, 13, 24, 0.56)');
  grad.addColorStop(0.55, 'rgba(8, 13, 24, 0.22)');
  grad.addColorStop(1, 'rgba(8, 13, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createStudioFloorTextures(
  maxAnisotropy: number,
  isDark: boolean
): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 512;
  const albedo = document.createElement('canvas');
  albedo.width = size;
  albedo.height = size;
  const ctx = albedo.getContext('2d')!;

  ctx.fillStyle = isDark ? '#151E2E' : '#DCE3ED';
  ctx.fillRect(0, 0, size, size);

  // Subtle architectural concrete tonal variation
  for (let i = 0; i < 1600; i++) {
    const x = ((i * 73) % size);
    const y = ((i * 139) % size);
    const r = 2 + (i % 4);
    ctx.fillStyle = isDark
      ? i % 2 === 0
        ? 'rgba(255,255,255,0.022)'
        : 'rgba(0,0,0,0.06)'
      : i % 2 === 0
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(16,24,40,0.045)';
    ctx.fillRect(x, y, r, r);
  }

  // Expansion joint grid lines
  ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(51, 65, 85, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.anisotropy = maxAnisotropy;

  // Linear roughness data map (no SRGBColorSpace)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rctx = roughCanvas.getContext('2d')!;
  rctx.fillStyle = '#B8B8B8';
  rctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    const shade = 155 + ((i * 17) % 60);
    rctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    rctx.fillRect(x, y, 3, 3);
  }
  rctx.strokeStyle = '#DCDCDC';
  rctx.lineWidth = 2;
  rctx.strokeRect(1, 1, 254, 254);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(8, 8);
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

function createBrushedMetalRoughnessMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#606060';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    const v = 72 + ((y * 19) % 34);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function drawTelemetryScreen(
  canvas: HTMLCanvasElement,
  texture: THREE.CanvasTexture,
  telemetry: StudioNodeTelemetry,
  lang: Language,
  selected: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Deep studio HUD canvas
  ctx.fillStyle = '#0D1526';
  ctx.fillRect(0, 0, w, h);

  // Header accent strip
  ctx.fillStyle = telemetry.accentHex;
  ctx.fillRect(0, 0, w, 14);

  if (selected) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
  }

  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  const padX = lang === 'ar' ? w - 26 : 26;
  ctx.textAlign = lang === 'ar' ? 'right' : 'left';

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 18px sans-serif';
  ctx.fillText('BALANCE OS · LIVE TELEMETRY', padX, 46);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 28px sans-serif';
  const title = lang === 'ar' ? telemetry.titleAr : telemetry.titleEn;
  ctx.fillText(title.slice(0, 28), padX, 86);

  // Metric tiles
  const metrics = telemetry.metrics.slice(0, 3);
  const tileW = (w - 64 - 24) / 3;
  metrics.forEach((m, idx) => {
    const x = 32 + idx * (tileW + 12);
    const y = 114;
    ctx.fillStyle = '#17233B';
    ctx.fillRect(x, y, tileW, 118);
    ctx.fillStyle = telemetry.accentHex;
    ctx.fillRect(x, y, tileW, 5);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 34px monospace';
    ctx.fillText(m.value, x + tileW / 2, y + 58);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 16px sans-serif';
    const label = lang === 'ar' ? m.labelAr : m.labelEn;
    ctx.fillText(label.slice(0, 18), x + tileW / 2, y + 96);
  });

  texture.needsUpdate = true;
}

function groundGroupOnFloor(group: THREE.Group, worldX: number, worldZ: number): void {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);

  for (const child of group.children) {
    child.position.x -= center.x;
    child.position.z -= center.z;
    child.position.y -= box.min.y;
  }
  group.position.set(worldX, 0, worldZ);
  group.updateMatrixWorld(true);
}

function tagNodeHierarchy(group: THREE.Group, nodeId: StudioNodeId): void {
  group.userData.nodeId = nodeId;
  group.traverse((obj) => {
    obj.userData.nodeId = nodeId;
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

function registerExplodable(
  list: ExplodablePart[],
  object: THREE.Object3D,
  offset: [number, number, number]
): void {
  list.push({
    object,
    basePos: [object.position.x, object.position.y, object.position.z],
    offset,
  });
}

export function buildStudioScene(params: {
  telemetry: Record<StudioNodeId, StudioNodeTelemetry>;
  lang: Language;
  isDark: boolean;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
}): StudioSceneBundle {
  const { telemetry, lang, isDark, isSoftwareGl, maxAnisotropy } = params;
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const explodables: ExplodablePart[] = [];
  const brushedMap = track(createBrushedMetalRoughnessMap());
  const shadowTex = track(createContactShadowTexture());
  const floorTex = createStudioFloorTextures(maxAnisotropy, isDark);
  track(floorTex.map);
  track(floorTex.roughnessMap);

  // Shared PBR material palette (distinct roughness values >= 0.25 delta between adjacent parts)
  const matteRubberMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.88,
      metalness: 0.05,
    })
  );
  const darkChassisMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x242b38,
      roughness: 0.54,
      metalness: 0.28,
    })
  );
  const slatePlinthMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x334155,
      roughness: 0.68,
      metalness: 0.14,
    })
  );
  const deskSurfaceMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x263246 : 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.08,
    })
  );
  const brushedAluminumMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.24,
      metalness: 0.88,
      roughnessMap: brushedMap,
    })
  );
  const chromeSteelMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.14,
      metalness: 0.94,
    })
  );
  const cobaltAnodizedMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.25,
      metalness: 0.82,
    })
  );
  const brassAccentMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.22,
      metalness: 0.88,
    })
  );
  const opticalGlassMat = track(
    isSoftwareGl
      ? new THREE.MeshStandardMaterial({
          color: 0x0f274a,
          roughness: 0.06,
          metalness: 0.3,
          envMapIntensity: 1.5,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0x1d4ed8,
          roughness: 0.04,
          metalness: 0.0,
          transmission: 0.78,
          ior: 1.52,
          thickness: 0.14,
          envMapIntensity: 1.4,
        })
  );

  // 1. Studio Floor + Curved Cyclorama Cove
  const floorMat = track(
    new THREE.MeshStandardMaterial({
      map: floorTex.map,
      roughnessMap: floorTex.roughnessMap,
      roughness: 0.85,
      metalness: 0.04,
    })
  );
  const floorGeo = track(new THREE.CircleGeometry(18, 64));
  floorGeo.rotateX(-Math.PI / 2);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  // Cyclorama curved cove backdrop at rear
  const coveShape = new THREE.Shape();
  coveShape.moveTo(-11, 0);
  coveShape.lineTo(11, 0);
  coveShape.lineTo(11, 0.18);
  coveShape.lineTo(-11, 0.18);
  coveShape.closePath();

  const coveWallMat = track(
    new THREE.MeshStandardMaterial({
      color: isDark ? 0x162033 : 0xc5d0e0,
      roughness: 0.78,
      metalness: 0.08,
    })
  );
  const coveArcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8.5, 0, -4.6),
    new THREE.Vector3(-4.5, 0, -6.2),
    new THREE.Vector3(0, 0, -6.7),
    new THREE.Vector3(4.5, 0, -6.2),
    new THREE.Vector3(8.5, 0, -4.6),
  ]);
  const coveBaseGeo = track(new THREE.TubeGeometry(coveArcCurve, 36, 0.12, 12, false));
  const coveBaseMesh = new THREE.Mesh(coveBaseGeo, slatePlinthMat);
  coveBaseMesh.position.y = 0.06;
  coveBaseMesh.receiveShadow = true;
  root.add(coveBaseMesh);

  // Architectural studio wall panels along back curve with acoustic trim fins
  const backPanelGeo = track(createExtrudedRoundedBox(3.4, 3.6, 0.18, 0.08, 0.02));
  const slatGeo = track(new THREE.BoxGeometry(0.06, 3.0, 0.05));
  const accentStripMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.72,
      roughness: 0.3,
    })
  );
  const stripGeo = track(new THREE.BoxGeometry(3.1, 0.06, 0.04));
  [-3.8, 0, 3.8].forEach((xPos, idx) => {
    const panel = new THREE.Mesh(backPanelGeo, coveWallMat);
    panel.position.set(xPos, 1.8, idx === 1 ? -6.35 : -5.85);
    panel.rotation.y = idx === 0 ? 0.22 : idx === 2 ? -0.22 : 0;
    panel.receiveShadow = true;
    panel.castShadow = true;
    root.add(panel);

    const strip = new THREE.Mesh(stripGeo, accentStripMat);
    strip.position.set(0, 1.48, 0.11);
    panel.add(strip);

    for (let s = -1.2; s <= 1.21; s += 0.6) {
      const slat = new THREE.Mesh(slatGeo, slatePlinthMat);
      slat.position.set(s, -0.1, 0.1);
      panel.add(slat);
    }
  });

  const addShadowDisc = (x: number, z: number, radius: number, opacity = 0.9) => {
    const g = track(new THREE.PlaneGeometry(radius * 2, radius * 2));
    g.rotateX(-Math.PI / 2);
    const m = track(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })
    );
    const disc = new THREE.Mesh(g, m);
    disc.position.set(x, 0.004, z);
    root.add(disc);
  };

  // ==========================================================
  // HERO 1: Cinema Production Camera Rig (11 articulated parts)
  // ==========================================================
  const cameraGroup = new THREE.Group();
  const dollyPlateGeo = track(createExtrudedRoundedBox(0.95, 0.08, 0.95, 0.18, 0.02));
  const dollyPlate = new THREE.Mesh(dollyPlateGeo, darkChassisMat);
  dollyPlate.position.y = 0.12;
  cameraGroup.add(dollyPlate);

  // 3 radial spider legs + rubber caster pads
  const legGeo = track(createExtrudedRoundedBox(0.14, 0.06, 0.85, 0.04, 0.015));
  const casterGeo = track(new THREE.CylinderGeometry(0.09, 0.11, 0.08, 20));
  for (let i = 0; i < 3; i++) {
    const ang = (i * Math.PI * 2) / 3;
    const legPivot = new THREE.Group();
    legPivot.rotation.y = ang;
    const leg = new THREE.Mesh(legGeo, brushedAluminumMat);
    leg.position.set(0, 0.1, 0.56);
    legPivot.add(leg);

    const pad = new THREE.Mesh(casterGeo, matteRubberMat);
    pad.position.set(0, 0.04, 0.92);
    legPivot.add(pad);
    cameraGroup.add(legPivot);
  }

  // Carbon mast + brass locking collar
  const mastGeo = track(new THREE.CylinderGeometry(0.065, 0.08, 1.08, 24));
  const mast = new THREE.Mesh(mastGeo, darkChassisMat);
  mast.position.y = 0.68;
  cameraGroup.add(mast);

  const collarGeo = track(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 24));
  const collar = new THREE.Mesh(collarGeo, cobaltAnodizedMat);
  collar.position.y = 0.92;
  cameraGroup.add(collar);

  // Motorized fluid yoke
  const yokeGeo = track(createExtrudedRoundedBox(0.36, 0.14, 0.34, 0.08, 0.02));
  const yoke = new THREE.Mesh(yokeGeo, brushedAluminumMat);
  yoke.position.y = 1.24;
  cameraGroup.add(yoke);

  // Camera upper assembly (moves slightly upward in Exploded View)
  const camHeadGroup = new THREE.Group();
  camHeadGroup.position.set(0, 1.48, 0);
  cameraGroup.add(camHeadGroup);

  const camBodyGeo = track(createExtrudedRoundedBox(0.34, 0.32, 0.48, 0.06, 0.025));
  const camBody = new THREE.Mesh(camBodyGeo, darkChassisMat);
  camHeadGroup.add(camBody);

  // Top handle (TubeGeometry)
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.16, -0.16),
    new THREE.Vector3(0, 0.28, -0.14),
    new THREE.Vector3(0, 0.29, 0.12),
    new THREE.Vector3(0, 0.16, 0.16),
  ]);
  const handleGeo = track(new THREE.TubeGeometry(handleCurve, 24, 0.024, 12, false));
  const topHandle = new THREE.Mesh(handleGeo, brushedAluminumMat);
  camHeadGroup.add(topHandle);
  registerExplodable(explodables, topHandle, [0, 0.35, 0]);

  // Stepped Cinema Prime Lens (LatheGeometry)
  const lensPts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.11, 0.0),
    new THREE.Vector2(0.11, 0.08),
    new THREE.Vector2(0.125, 0.1),
    new THREE.Vector2(0.125, 0.22),
    new THREE.Vector2(0.14, 0.24),
    new THREE.Vector2(0.14, 0.36),
    new THREE.Vector2(0.105, 0.36),
  ];
  const lensGeo = track(new THREE.LatheGeometry(lensPts, 32));
  lensGeo.rotateX(Math.PI / 2);
  const lensGroup = new THREE.Group();
  lensGroup.position.set(0, 0.0, 0.24);
  const lensBarrel = new THREE.Mesh(lensGeo, darkChassisMat);
  lensGroup.add(lensBarrel);

  const lensRingGeo = track(new THREE.TorusGeometry(0.132, 0.014, 12, 32));
  const lensRing = new THREE.Mesh(lensRingGeo, brassAccentMat);
  lensRing.position.z = 0.24;
  lensGroup.add(lensRing);

  const glassGeo = track(new THREE.CylinderGeometry(0.098, 0.098, 0.03, 28));
  glassGeo.rotateX(Math.PI / 2);
  const frontElement = new THREE.Mesh(glassGeo, opticalGlassMat);
  frontElement.position.z = 0.35;
  lensGroup.add(frontElement);
  camHeadGroup.add(lensGroup);
  registerExplodable(explodables, lensGroup, [0, 0, 0.42]);

  // Matte Box Sunshade
  const matteBoxGeo = track(createExtrudedRoundedBox(0.42, 0.3, 0.12, 0.04, 0.015));
  const matteBox = new THREE.Mesh(matteBoxGeo, matteRubberMat);
  matteBox.position.set(0, 0, 0.66);
  camHeadGroup.add(matteBox);
  registerExplodable(explodables, matteBox, [0, 0.08, 0.85]);

  // Rear V-Mount Battery Pack
  const batteryGeo = track(createExtrudedRoundedBox(0.24, 0.26, 0.14, 0.03, 0.015));
  const battery = new THREE.Mesh(batteryGeo, matteRubberMat);
  battery.position.set(0, 0, -0.32);
  camHeadGroup.add(battery);
  registerExplodable(explodables, battery, [0, 0, -0.42]);

  // Side Director Telemetry Monitor
  const camScreenCanvas = document.createElement('canvas');
  camScreenCanvas.width = 640;
  camScreenCanvas.height = 300;
  const camScreenTex = track(new THREE.CanvasTexture(camScreenCanvas));
  camScreenTex.colorSpace = THREE.SRGBColorSpace;
  camScreenTex.anisotropy = maxAnisotropy;
  const camScreenMat = track(
    new THREE.MeshStandardMaterial({
      map: camScreenTex,
      emissiveMap: camScreenTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.72,
      roughness: 0.2,
    })
  );
  drawTelemetryScreen(camScreenCanvas, camScreenTex, telemetry.camera_rig, lang, false);

  const sideMonGroup = new THREE.Group();
  sideMonGroup.position.set(0.34, 0.08, 0.02);
  sideMonGroup.rotation.y = Math.PI / 2.6;
  const monFrameGeo = track(createExtrudedRoundedBox(0.46, 0.26, 0.04, 0.025, 0.01));
  const monFrame = new THREE.Mesh(monFrameGeo, brushedAluminumMat);
  sideMonGroup.add(monFrame);
  const camScreenPlaneGeo = track(new THREE.PlaneGeometry(0.41, 0.21));
  const camScreenPlane = new THREE.Mesh(camScreenPlaneGeo, camScreenMat);
  camScreenPlane.position.z = 0.036;
  sideMonGroup.add(camScreenPlane);
  camHeadGroup.add(sideMonGroup);
  registerExplodable(explodables, sideMonGroup, [0.42, 0.18, 0]);

  groundGroupOnFloor(cameraGroup, -0.85, 0.45);
  cameraGroup.rotation.y = 0.36;
  tagNodeHierarchy(cameraGroup, 'camera_rig');
  root.add(cameraGroup);
  addShadowDisc(-0.85, 0.45, 1.05, 0.92);

  // ==========================================================
  // HERO 2: Architectural Lighting Gantry & Octabox (7 parts)
  // ==========================================================
  const gantryGroup = new THREE.Group();
  const cStandBaseGeo = track(createExtrudedRoundedBox(0.86, 0.07, 0.86, 0.16, 0.018));
  const cStandBase = new THREE.Mesh(cStandBaseGeo, matteRubberMat);
  cStandBase.position.y = 0.04;
  gantryGroup.add(cStandBase);

  const riserGeo = track(new THREE.CylinderGeometry(0.045, 0.055, 2.2, 20));
  const riser = new THREE.Mesh(riserGeo, chromeSteelMat);
  riser.position.y = 1.12;
  gantryGroup.add(riser);

  const gripHeadGeo = track(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 20));
  gripHeadGeo.rotateZ(Math.PI / 2);
  const gripHead = new THREE.Mesh(gripHeadGeo, brassAccentMat);
  gripHead.position.y = 2.18;
  gantryGroup.add(gripHead);

  const boomCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.18, 0),
    new THREE.Vector3(0.45, 2.34, 0.35),
    new THREE.Vector3(0.88, 2.22, 0.65),
  ]);
  const boomGeo = track(new THREE.TubeGeometry(boomCurve, 20, 0.032, 12, false));
  const boomArm = new THREE.Mesh(boomGeo, brushedAluminumMat);
  gantryGroup.add(boomArm);

  // Softbox Assembly
  const softboxGroup = new THREE.Group();
  softboxGroup.position.set(0.88, 2.2, 0.65);
  softboxGroup.lookAt(-0.4, 1.2, 0.2);

  const ballastGeo = track(createExtrudedRoundedBox(0.24, 0.24, 0.28, 0.05, 0.018));
  const ballast = new THREE.Mesh(ballastGeo, darkChassisMat);
  ballast.position.z = -0.18;
  softboxGroup.add(ballast);

  const octaboxPts = [
    new THREE.Vector2(0.12, -0.05),
    new THREE.Vector2(0.46, 0.24),
    new THREE.Vector2(0.46, 0.28),
  ];
  const octaboxGeo = track(new THREE.LatheGeometry(octaboxPts, 8));
  octaboxGeo.rotateX(Math.PI / 2);
  const octaboxShell = new THREE.Mesh(octaboxGeo, matteRubberMat);
  softboxGroup.add(octaboxShell);

  const softboxDiffuserMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfff8eb,
      emissive: 0xffedd5,
      emissiveIntensity: 1.35,
      roughness: 0.72,
    })
  );
  const diffuserGeo = track(new THREE.CircleGeometry(0.44, 8));
  const diffuser = new THREE.Mesh(diffuserGeo, softboxDiffuserMat);
  diffuser.position.z = 0.27;
  softboxGroup.add(diffuser);
  gantryGroup.add(softboxGroup);
  registerExplodable(explodables, softboxGroup, [0.35, 0.38, 0.25]);

  groundGroupOnFloor(gantryGroup, 1.25, -0.4);
  tagNodeHierarchy(gantryGroup, 'lighting_gantry');
  root.add(gantryGroup);
  addShadowDisc(1.25, -0.4, 0.85, 0.82);

  // ==========================================================
  // HERO 3: Interactive Operations Console Pods (Branches & Creative Divisions)
  // ==========================================================
  const consoleConfigs: Array<{
    id: StudioNodeId;
    x: number;
    z: number;
    rotY: number;
    colorHex: number;
  }> = [
    { id: 'cairo_hq', x: -3.5, z: -1.8, rotY: 0.48, colorHex: 0x0284c7 },
    { id: 'alex_branch', x: -2.9, z: 1.5, rotY: 0.62, colorHex: 0x16a34a },
    { id: 'editing_bay', x: 3.4, z: -1.6, rotY: 0.16, colorHex: 0x7c3aed },
    { id: 'dev_cluster', x: 3.0, z: 1.5, rotY: 0.12, colorHex: 0x0f766e },
  ];

  const nodes = {} as Record<StudioNodeId, InteractiveStudioNode>;
  nodes.camera_rig = {
    id: 'camera_rig',
    group: cameraGroup,
    screenMaterial: camScreenMat,
    screenCanvas: camScreenCanvas,
    screenTexture: camScreenTex,
    baseWorldPos: new THREE.Vector3(-0.85, 0, 0.45),
  };
  nodes.lighting_gantry = {
    id: 'lighting_gantry',
    group: gantryGroup,
    baseWorldPos: new THREE.Vector3(1.25, 0, -0.4),
  };

  const plinthGeo = track(createExtrudedRoundedBox(1.55, 0.14, 1.12, 0.14, 0.025));
  const pedestalColGeo = track(createExtrudedRoundedBox(0.36, 0.74, 0.34, 0.08, 0.02));
  const deskWingGeo = track(createExtrudedRoundedBox(1.48, 0.07, 0.82, 0.12, 0.02));
  const monitorShellGeo = track(createExtrudedRoundedBox(1.28, 0.66, 0.06, 0.05, 0.015));
  const monitorScreenGeo = track(new THREE.PlaneGeometry(1.18, 0.56));
  const finGeo = track(createExtrudedRoundedBox(0.12, 0.92, 0.24, 0.04, 0.015));
  const dialGeo = track(new THREE.CylinderGeometry(0.07, 0.08, 0.045, 24));
  const ringSelectGeo = track(new THREE.RingGeometry(0.86, 0.94, 40));
  ringSelectGeo.rotateX(-Math.PI / 2);

  for (const cfg of consoleConfigs) {
    const pod = new THREE.Group();

    const plinth = new THREE.Mesh(plinthGeo, slatePlinthMat);
    plinth.position.y = 0.07;
    pod.add(plinth);

    const col = new THREE.Mesh(pedestalColGeo, brushedAluminumMat);
    col.position.y = 0.5;
    pod.add(col);

    const desk = new THREE.Mesh(deskWingGeo, deskSurfaceMat);
    desk.position.set(0, 0.89, 0.08);
    pod.add(desk);

    const dial = new THREE.Mesh(dialGeo, brassAccentMat);
    dial.position.set(0.45, 0.95, 0.25);
    pod.add(dial);

    // Sculpted anodized beacon fin
    const finMat = track(
      new THREE.MeshStandardMaterial({
        color: cfg.colorHex,
        roughness: 0.24,
        metalness: 0.82,
      })
    );
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(-0.62, 1.38, -0.2);
    pod.add(fin);
    registerExplodable(explodables, fin, [-0.28, 0.35, -0.15]);

    // Widescreen telemetry display
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 640;
    sCanvas.height = 300;
    const sTex = track(new THREE.CanvasTexture(sCanvas));
    sTex.colorSpace = THREE.SRGBColorSpace;
    sTex.anisotropy = maxAnisotropy;
    const sMat = track(
      new THREE.MeshStandardMaterial({
        map: sTex,
        emissiveMap: sTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.68,
        roughness: 0.22,
      })
    );
    drawTelemetryScreen(sCanvas, sTex, telemetry[cfg.id], lang, false);

    const monGroup = new THREE.Group();
    monGroup.position.set(0, 1.36, -0.18);
    const shell = new THREE.Mesh(monitorShellGeo, darkChassisMat);
    monGroup.add(shell);
    const screen = new THREE.Mesh(monitorScreenGeo, sMat);
    screen.position.z = 0.052;
    monGroup.add(screen);
    pod.add(monGroup);
    registerExplodable(explodables, monGroup, [0, 0.42, -0.15]);

    // Ground selection ring
    const ringMat = track(
      new THREE.MeshBasicMaterial({
        color: cfg.colorHex,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    const ring = new THREE.Mesh(ringSelectGeo, ringMat);
    ring.position.y = 0.006;
    pod.add(ring);

    groundGroupOnFloor(pod, cfg.x, cfg.z);
    pod.rotation.y = cfg.rotY;
    tagNodeHierarchy(pod, cfg.id);
    root.add(pod);
    addShadowDisc(cfg.x, cfg.z, 1.15, 0.85);

    nodes[cfg.id] = {
      id: cfg.id,
      group: pod,
      screenMaterial: sMat,
      screenCanvas: sCanvas,
      screenTexture: sTex,
      accentRing: ring,
      baseWorldPos: new THREE.Vector3(cfg.x, 0, cfg.z),
    };
  }

  return {
    root,
    nodes,
    explodables,
    floorMaterial: floorMat,
    coveMaterial: coveWallMat,
    softboxEmissiveMaterial: softboxDiffuserMat,
    studioAccentStripMaterial: accentStripMat,
    disposables,
  };
}
