import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDemoDataset } from '../data/seedData';
import { buildAiChatPayload, buildDemoAiResponse } from './aiService';

test('buildAiChatPayload rejects empty or whitespace prompts', () => {
  const data = buildDemoDataset();
  assert.throws(() =>
    buildAiChatPayload({
      role: 'ceo',
      prompt: '   ',
      lang: 'en',
      revenuePiasters: 100000,
      netProfitPiasters: 45000,
      data,
    })
  );
});

test('buildAiChatPayload extracts at-risk projects and pending approvals', () => {
  const data = buildDemoDataset();
  const payload = buildAiChatPayload({
    role: 'finance',
    prompt: '  Check liquidity  ',
    lang: 'en',
    revenuePiasters: 500000,
    netProfitPiasters: 200000,
    data,
  });

  assert.equal(payload.prompt, 'Check liquidity');
  assert.equal(payload.role, 'finance');
  assert.equal(payload.contextSummary.projectsCount, data.projects.length);
  assert.equal(
    payload.contextSummary.atRiskProjects.length,
    data.projects.filter((p) => p.status === 'at_risk').length
  );
});

test('buildDemoAiResponse formats bilingual grounded summary', () => {
  const data = buildDemoDataset();
  const arText = buildDemoAiResponse({
    role: 'ceo',
    lang: 'ar',
    revenuePiasters: 1200000,
    netProfitPiasters: 400000,
    data,
  });
  const enText = buildDemoAiResponse({
    role: 'sales',
    lang: 'en',
    revenuePiasters: 1200000,
    netProfitPiasters: 400000,
    data,
  });

  assert.match(arText, /حقائق مؤكدة/);
  assert.match(enText, /Confirmed Facts/);
  assert.match(enText, /SALES/);
});
