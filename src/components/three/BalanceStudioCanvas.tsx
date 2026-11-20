import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Language, ThemeMode } from '../../types/os';
import {
  CAMERA_PRESETS,
  computeExplodePosition,
  dampTuple3,
  isSoftwareGlRenderer,
  type CameraPresetId,
  type LightingPresetId,
  type StudioNodeId,
  type StudioNodeTelemetry,
} from '../../utils/studio3d';
import {
  buildStudioScene,
  drawTelemetryScreen,
  type StudioSceneBundle,
} from './studioGeometry';

interface BalanceStudioCanvasProps {
  telemetry: Record<StudioNodeId, StudioNodeTelemetry>;
  lang: Language;
  theme: ThemeMode;
  selectedNodeId: StudioNodeId | null;
  cameraPreset: CameraPresetId;
  cameraPresetTick: number;
  lightingPreset: LightingPresetId;
  explodeMode: boolean;
  autoRotate: boolean;
  onSelectNode: (nodeId: StudioNodeId | null) => void;
  onWebGLError: (message: string) => void;
  onRendererReady?: (info: { isSoftwareGl: boolean }) => void;
}

export function BalanceStudioCanvas({
  telemetry,
  lang,
  theme,
  selectedNodeId,
  cameraPreset,
  cameraPresetTick,
  lightingPreset,
  explodeMode,
  autoRotate,
  onSelectNode,
  onWebGLError,
  onRendererReady,
}: BalanceStudioCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store React props/callbacks in refs so WebGL context is never recreated on prop updates
  const onSelectRef = useRef(onSelectNode);
  const onErrorRef = useRef(onWebGLError);
  const onReadyRef = useRef(onRendererReady);
  onSelectRef.current = onSelectNode;
  onErrorRef.current = onWebGLError;
  onReadyRef.current = onRendererReady;

  const controlStateRef = useRef({
    explodeTarget: explodeMode ? 1 : 0,
    explodeCurrent: explodeMode ? 1 : 0,
    autoRotate,
    lightingPreset,
    theme,
    selectedNodeId,
    lang,
    telemetry,
    animatingCamera: false,
    camTargetPos: [...CAMERA_PRESETS[cameraPreset].position] as [number, number, number],
    camTargetLook: [...CAMERA_PRESETS[cameraPreset].target] as [number, number, number],
  });

  controlStateRef.current.explodeTarget = explodeMode ? 1 : 0;
  controlStateRef.current.autoRotate = autoRotate;
  controlStateRef.current.lightingPreset = lightingPreset;
  controlStateRef.current.theme = theme;
  controlStateRef.current.selectedNodeId = selectedNodeId;
  controlStateRef.current.lang = lang;
  controlStateRef.current.telemetry = telemetry;

  const sceneRefs = useRef<{
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    bundle?: StudioSceneBundle;
    keyLight?: THREE.DirectionalLight;
    hemiLight?: THREE.HemisphereLight;
    rimLight?: THREE.DirectionalLight;
    requestRender?: () => void;
  }>({});

  // Trigger camera glide on preset change
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    controlStateRef.current.camTargetPos = [...preset.position];
    controlStateRef.current.camTargetLook = [...preset.target];
    controlStateRef.current.animatingCamera = true;
    sceneRefs.current.requestRender?.();
  }, [cameraPreset, cameraPresetTick]);

  // Trigger camera focus when selecting a specific node
  useEffect(() => {
    if (!selectedNodeId || !sceneRefs.current.bundle) return;
    const node = sceneRefs.current.bundle.nodes[selectedNodeId];
    if (!node) return;
    const base = node.baseWorldPos;
    const offsetX = base.x >= 0 ? 2.4 : -2.4;
    const offsetZ = base.z >= 0 ? 3.2 : 3.4;
    controlStateRef.current.camTargetPos = [base.x + offsetX, 2.55, base.z + offsetZ];
    controlStateRef.current.camTargetLook = [base.x, 1.1, base.z];
    controlStateRef.current.animatingCamera = true;
    sceneRefs.current.requestRender?.();
  }, [selectedNodeId]);

  // Update dynamic screen textures whenever telemetry, language, or selection changes
  useEffect(() => {
    const bundle = sceneRefs.current.bundle;
    if (!bundle) return;
    (Object.keys(bundle.nodes) as StudioNodeId[]).forEach((id) => {
      const node = bundle.nodes[id];
      if (node.screenCanvas && node.screenTexture) {
        drawTelemetryScreen(
          node.screenCanvas,
          node.screenTexture,
          telemetry[id],
          lang,
          selectedNodeId === id
        );
      }
      if (node.accentRing) {
        const mat = node.accentRing.material as THREE.MeshBasicMaterial;
        mat.opacity = selectedNodeId === id ? 0.85 : 0.26;
      }
    });
    sceneRefs.current.requestRender?.();
  }, [telemetry, lang, selectedNodeId]);

  // Update lighting and theme mood without tearing down WebGL
  useEffect(() => {
    const { scene, renderer, keyLight, hemiLight, rimLight, bundle } = sceneRefs.current;
    if (!scene || !renderer || !keyLight || !hemiLight || !rimLight || !bundle) return;

    const isDark = theme === 'dark';
    let bgHex = isDark ? 0x0b1220 : 0xeef3f9;
    let keyIntensity = 2.1;
    let keyColor = 0xfff7ed;
    let hemiIntensity = 0.85;
    let rimIntensity = 0.7;

    if (lightingPreset === 'daylight') {
      bgHex = isDark ? 0x111c33 : 0xf4f7fb;
      keyIntensity = 2.6;
      keyColor = 0xffffff;
      hemiIntensity = 1.1;
      rimIntensity = 0.5;
    } else if (lightingPreset === 'cinema') {
      bgHex = 0x090d16;
      keyIntensity = 2.85;
      keyColor = 0xffdba8;
      hemiIntensity = 0.42;
      rimIntensity = 1.25;
    }

    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.032);
    keyLight.intensity = keyIntensity;
    keyLight.color.setHex(keyColor);
    hemiLight.intensity = hemiIntensity;
    rimLight.intensity = rimIntensity;

    bundle.softboxEmissiveMaterial.emissiveIntensity = lightingPreset === 'cinema' ? 1.85 : 1.1;
    bundle.coveMaterial.color.setHex(
      lightingPreset === 'cinema' ? 0x111827 : isDark ? 0x182235 : 0xdde5f0
    );
    renderer.toneMappingExposure = lightingPreset === 'cinema' ? 1.08 : 1.0;
    sceneRefs.current.requestRender?.();
  }, [lightingPreset, theme]);

  // One-time WebGL initialization & teardown
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    let isSoftwareGl = false;

    try {
      const probeCanvas = document.createElement('canvas');
      const gl2 = probeCanvas.getContext('webgl2');
      if (!gl2) {
        onErrorRef.current('WebGL2 is unavailable in this browser.');
        return;
      }
      const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info');
      const unmasked = debugInfo
        ? String(gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
        : '';
      isSoftwareGl = isSoftwareGlRenderer(unmasked);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: isSoftwareGl ? 'default' : 'high-performance',
      });
    } catch (err) {
      onErrorRef.current(err instanceof Error ? err.message : 'Unable to create WebGL context.');
      return;
    }

    onReadyRef.current?.({ isSoftwareGl });

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = isSoftwareGl ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initDark = controlStateRef.current.theme === 'dark';
    const initBg = initDark ? 0x0b1220 : 0xeef3f9;
    scene.background = new THREE.Color(initBg);
    scene.fog = new THREE.FogExp2(initBg, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    const initPreset = CAMERA_PRESETS.overview;
    camera.position.set(...initPreset.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.target.set(...initPreset.target);
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 2.4;
    controls.maxDistance = 16;
    controls.autoRotateSpeed = 0.85;

    // Three-point + Hemisphere studio lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.1);
    keyLight.position.set(5.5, 8.2, 6.2);
    keyLight.castShadow = true;
    const shadowRes = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.mapSize.set(shadowRes, shadowRes);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 26;
    keyLight.shadow.camera.left = -7.5;
    keyLight.shadow.camera.right = 7.5;
    keyLight.shadow.camera.top = 7.5;
    keyLight.shadow.camera.bottom = -7.5;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-6.0, 4.5, -5.5);
    scene.add(rimLight);

    const maxAnisotropy = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const bundle = buildStudioScene({
      telemetry: controlStateRef.current.telemetry,
      lang: controlStateRef.current.lang,
      isDark: initDark,
      isSoftwareGl,
      maxAnisotropy,
    });
    scene.add(bundle.root);

    // Raycaster & click vs drag detection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      // Interrupt preset glide if user manually grabs orbit controls
      controlStateRef.current.animatingCamera = false;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const targets = Object.values(bundle.nodes).map((n) => n.group);
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as StudioNodeId | undefined;
        onSelectRef.current(hitId ?? null);
      } else {
        onSelectRef.current(null);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    let rafId = 0;
    let lastTime = performance.now();
    let needsRender = true;
    const requestRender = () => {
      needsRender = true;
    };

    sceneRefs.current = {
      scene,
      renderer,
      camera,
      controls,
      bundle,
      keyLight,
      hemiLight,
      rimLight,
      requestRender,
    };

    const handleControlsChange = () => {
      needsRender = true;
    };
    controls.addEventListener('change', handleControlsChange);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 320);
        const h = Math.max(entry.contentRect.height, 320);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        needsRender = true;
      }
    });
    resizeObserver.observe(container);

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const st = controlStateRef.current;
      controls.autoRotate = st.autoRotate && !st.animatingCamera;

      // Exploded view exponential damping
      if (Math.abs(st.explodeCurrent - st.explodeTarget) > 0.002) {
        const nextFactor =
          st.explodeCurrent +
          (st.explodeTarget - st.explodeCurrent) * (1 - Math.exp(-7 * dt));
        st.explodeCurrent = nextFactor;
        for (const part of bundle.explodables) {
          const pos = computeExplodePosition(part.basePos, part.offset, nextFactor);
          part.object.position.set(pos[0], pos[1], pos[2]);
        }
        needsRender = true;
      }

      // Smooth camera glide
      if (st.animatingCamera) {
        const nextPos = dampTuple3(
          [camera.position.x, camera.position.y, camera.position.z],
          st.camTargetPos,
          5.5,
          dt
        );
        const nextLook = dampTuple3(
          [controls.target.x, controls.target.y, controls.target.z],
          st.camTargetLook,
          6.0,
          dt
        );
        camera.position.set(nextPos[0], nextPos[1], nextPos[2]);
        controls.target.set(nextLook[0], nextLook[1], nextLook[2]);

        const distPos = Math.hypot(
          nextPos[0] - st.camTargetPos[0],
          nextPos[1] - st.camTargetPos[1],
          nextPos[2] - st.camTargetPos[2]
        );
        if (distPos < 0.03) {
          st.animatingCamera = false;
        }
        needsRender = true;
      }

      const controlsUpdated = controls.update();
      if (controlsUpdated || st.autoRotate) {
        needsRender = true;
      }

      if (needsRender) {
        renderer.render(scene, camera);
        needsRender = false;
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.removeEventListener('change', handleControlsChange);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      controls.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      bundle.disposables.forEach((d) => d.dispose());
      envTarget.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRefs.current = {};
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full touch-none select-none" />;
}
