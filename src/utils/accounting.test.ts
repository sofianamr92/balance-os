import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProjectContributionMargin,
  computeArAging,
  computeFinancialStatements,
  computeInvoiceStatus,
  computeTrialBalance,
  createReversalLines,
  toPiasters,
  validateJournalEntry,
} from './accounting';
import type { Account, FiscalPeriod, Invoice, JournalEntry, Project } from '../types/os';

const baseMeta = {
  ownerUid: 'u1',
  memberUids: ['u1'],
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const accounts: Account[] = [
  { ...baseMeta, id: 'acc-cash', code: '1101', name: 'الخزينة', nameEn: 'Cash', type: 'asset', status: 'active' },
  { ...baseMeta, id: 'acc-ar', code: '1201', name: 'العملاء', nameEn: 'AR', type: 'asset', status: 'active' },
  { ...baseMeta, id: 'acc-rev', code: '4101', name: 'إيرادات', nameEn: 'Revenue', type: 'revenue', status: 'active' },
  { ...baseMeta, id: 'acc-cost', code: '5101', name: 'تكلفة مباشرة', nameEn: 'Direct Cost', type: 'direct_cost', status: 'active' },
  { ...baseMeta, id: 'acc-opex', code: '5201', name: 'مصروف تشغيل', nameEn: 'OpEx', type: 'operating_expense', status: 'active' },
];

test('toPiasters converts EGP accurately without floating point drift', () => {
  assert.equal(toPiasters(1250.75), 125075);
  assert.equal(toPiasters(19.99), 1999);
});

test('validateJournalEntry rejects unbalanced entries and closed fiscal periods', () => {
  const openPeriod: FiscalPeriod = { ...baseMeta, id: 'p1', name: 'Nov 2026', startDate: '2026-11-01', endDate: '2026-11-30', status: 'open' };
  const closedPeriod: FiscalPeriod = { ...openPeriod, status: 'closed' };

  const unbalanced = validateJournalEntry(
    [
      { accountId: 'acc-cash', accountCode: '1101', accountName: 'Cash', debitPiasters: 10000, creditPiasters: 0 },
      { accountId: 'acc-rev', accountCode: '4101', accountName: 'Revenue', debitPiasters: 0, creditPiasters: 9000 },
    ],
    openPeriod
  );
  assert.equal(unbalanced.valid, false);

  const closedRes = validateJournalEntry(
    [
      { accountId: 'acc-cash', accountCode: '1101', accountName: 'Cash', debitPiasters: 10000, creditPiasters: 0 },
      { accountId: 'acc-rev', accountCode: '4101', accountName: 'Revenue', debitPiasters: 0, creditPiasters: 10000 },
    ],
    closedPeriod
  );
  assert.equal(closedRes.valid, false);
});

test('reversal lines flip debits and credits and keep trial balance balanced', () => {
  const originalLines = [
    { accountId: 'acc-cash', accountCode: '1101', accountName: 'Cash', debitPiasters: 50000, creditPiasters: 0 },
    { accountId: 'acc-rev', accountCode: '4101', accountName: 'Revenue', debitPiasters: 0, creditPiasters: 50000 },
  ];
  const revLines = createReversalLines(originalLines);
  assert.equal(revLines[0].creditPiasters, 50000);
  assert.equal(revLines[1].debitPiasters, 50000);

  const entries: JournalEntry[] = [
    {
      ...baseMeta,
      id: 'je1',
      entryNumber: 'JE-001',
      date: '2026-11-10',
      description: 'Revenue',
      periodId: 'p1',
      branchId: 'b1',
      status: 'posted',
      totalDebitPiasters: 50000,
      totalCreditPiasters: 50000,
      lines: originalLines,
    },
    {
      ...baseMeta,
      id: 'je2',
      entryNumber: 'JE-002',
      date: '2026-11-11',
      description: 'Reversal',
      periodId: 'p1',
      branchId: 'b1',
      status: 'posted',
      totalDebitPiasters: 50000,
      totalCreditPiasters: 50000,
      lines: revLines,
    },
  ];

  const tb = computeTrialBalance(accounts, entries, { includeDemo: true });
  const cashRow = tb.find((r) => r.accountId === 'acc-cash');
  assert.equal(cashRow?.netBalancePiasters, 0);
});

test('computeFinancialStatements excludes demo transactions when includeDemo is false', () => {
  const entries: JournalEntry[] = [
    {
      ...baseMeta,
      id: 'je-demo',
      entryNumber: 'JE-DEMO',
      date: '2026-11-10',
      description: 'Demo entry',
      periodId: 'p1',
      branchId: 'b1',
      status: 'posted',
      totalDebitPiasters: 100000,
      totalCreditPiasters: 100000,
      isDemo: true,
      lines: [
        { accountId: 'acc-ar', accountCode: '1201', accountName: 'AR', debitPiasters: 100000, creditPiasters: 0 },
        { accountId: 'acc-rev', accountCode: '4101', accountName: 'Rev', debitPiasters: 0, creditPiasters: 100000 },
      ],
    },
  ];

  const prodSummary = computeFinancialStatements(accounts, entries, { includeDemo: false });
  assert.equal(prodSummary.totalRevenuePiasters, 0);

  const demoSummary = computeFinancialStatements(accounts, entries, { includeDemo: true });
  assert.equal(demoSummary.totalRevenuePiasters, 100000);
  assert.equal(demoSummary.trialBalanceBalanced, true);
});

test('invoice status, AR aging, and project contribution margin work deterministically', () => {
  assert.equal(computeInvoiceStatus(10000, 5000, '2026-11-25', '2026-11-20'), 'partial');
  assert.equal(computeInvoiceStatus(10000, 5000, '2026-11-10', '2026-11-20'), 'overdue');
  assert.equal(computeInvoiceStatus(10000, 10000, '2026-11-10', '2026-11-20'), 'paid');

  const invoices: Invoice[] = [
    {
      ...baseMeta,
      id: 'inv1',
      invoiceNumber: 'INV-1',
      clientId: 'c1',
      branchId: 'b1',
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      lines: [],
      totalPiasters: 20000,
      paidPiasters: 5000,
      status: 'overdue',
    },
  ];
  const aging = computeArAging(invoices, '2026-11-20');
  assert.equal(aging.days31To60Piasters, 15000);
  assert.equal(aging.totalOutstandingPiasters, 15000);

  const project: Project = {
    ...baseMeta,
    id: 'p1',
    name: 'Video Campaign',
    clientId: 'c1',
    branchId: 'b1',
    departmentId: 'd1',
    managerUid: 'u1',
    status: 'active',
    priority: 'high',
    startDate: '2026-11-01',
    dueDate: '2026-11-30',
    approvedRevenuePiasters: 500000,
    estimatedCostPiasters: 200000,
    actualCostPiasters: 150000,
    progress: 60,
    deliverables: [],
  };
  const margin = calculateProjectContributionMargin(project);
  assert.equal(margin.contributionMarginPiasters, 350000);
  assert.equal(margin.marginPercent, 70);
});
