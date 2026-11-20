import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMERA_PRESETS,
  buildStudioTelemetry,
  computeExplodePosition,
  dampScalar,
  dampTuple3,
  isSoftwareGlRenderer,
} from './studio3d.ts';
import { buildDemoDataset } from '../data/seedData.ts';

test('isSoftwareGlRenderer detects software WebGL renderers accurately', () => {
  assert.equal(isSoftwareGlRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))'), true);
  assert.equal(isSoftwareGlRenderer('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
  assert.equal(isSoftwareGlRenderer('Mesa OffScreen'), true);
  assert.equal(isSoftwareGlRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)'), false);
  assert.equal(isSoftwareGlRenderer('Apple M3 Pro'), false);
  assert.equal(isSoftwareGlRenderer(null), false);
});

test('dampScalar and dampTuple3 move smoothly and clamp large dt', () => {
  const step = dampScalar(0, 10, 6, 0.016);
  assert.ok(step > 0 && step < 10);

  const clamped = dampScalar(0, 10, 6, 5.0);
  const atMaxDt = dampScalar(0, 10, 6, 0.1);
  assert.equal(clamped, atMaxDt);

  const tuple = dampTuple3([0, 0, 0], [4, 2, -6], 8, 0.05);
  assert.ok(tuple[0] > 0 && tuple[0] < 4);
  assert.ok(tuple[2] < 0 && tuple[2] > -6);
});

test('computeExplodePosition clamps explode factor to [0, 1]', () => {
  assert.deepEqual(computeExplodePosition([1, 2, 3], [0, 1, 0], 0), [1, 2, 3]);
  assert.deepEqual(computeExplodePosition([1, 2, 3], [0, 2, -1], 0.5), [1, 3, 2.5]);
  assert.deepEqual(computeExplodePosition([1, 2, 3], [0, 2, -1], 5), [1, 4, 2]);
});

test('buildStudioTelemetry maps BALANCE OS live data into all 6 spatial hubs', () => {
  const seed = buildDemoDataset('demo-ceo-01');
  const telemetry = buildStudioTelemetry(seed, 'en');

  assert.equal(Object.keys(telemetry).length, 6);
  assert.equal(telemetry.camera_rig.route, '/production');
  assert.equal(telemetry.cairo_hq.route, '/company/branches');
  assert.equal(telemetry.editing_bay.route, '/editing');
  assert.ok(Number(telemetry.cairo_hq.metrics[0].value) >= 1);
  assert.ok(CAMERA_PRESETS.overview.position.length === 3);
});
