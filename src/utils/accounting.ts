import type {
  Account,
  FiscalPeriod,
  Invoice,
  JournalEntry,
  JournalLine,
  Project,
} from '../types/os';

export function toPiasters(egpAmount: number): number {
  if (!Number.isFinite(egpAmount)) {
    throw new Error('Invalid monetary amount');
  }
  return Math.round(egpAmount * 100);
}

export function fromPiasters(piasters: number): number {
  return Math.round(piasters) / 100;
}

export function formatEGP(piasters: number, lang: 'ar' | 'en' = 'ar'): string {
  const value = fromPiasters(piasters);
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return lang === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
}

export interface JournalValidationResult {
  valid: boolean;
  totalDebitPiasters: number;
  totalCreditPiasters: number;
  errors: string[];
}

export function validateJournalEntry(
  lines: JournalLine[],
  period?: FiscalPeriod
): JournalValidationResult {
  const errors: string[] = [];

  if (period && period.status === 'closed') {
    errors.push('Cannot post to a closed fiscal period.');
  }

  if (!lines || lines.length < 2) {
    errors.push('Journal entry must contain at least 2 lines.');
  }

  let totalDebitPiasters = 0;
  let totalCreditPiasters = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.debitPiasters) || !Number.isInteger(line.creditPiasters)) {
      errors.push(`Line for account ${line.accountCode} must use integer piasters.`);
    }
    if (line.debitPiasters < 0 || line.creditPiasters < 0) {
      errors.push(`Negative amounts are not allowed on account ${line.accountCode}.`);
    }
    if (line.debitPiasters > 0 && line.creditPiasters > 0) {
      errors.push(`Line for account ${line.accountCode} cannot have both debit and credit.`);
    }
    if (line.debitPiasters === 0 && line.creditPiasters === 0) {
      errors.push(`Line for account ${line.accountCode} must have a non-zero amount.`);
    }
    totalDebitPiasters += line.debitPiasters;
    totalCreditPiasters += line.creditPiasters;
  }

  if (totalDebitPiasters <= 0) {
    errors.push('Total debits must be greater than zero.');
  }

  if (totalDebitPiasters !== totalCreditPiasters) {
    errors.push(
      `Journal entry is unbalanced: Debits (${totalDebitPiasters}) != Credits (${totalCreditPiasters}).`
    );
  }

  return {
    valid: errors.length === 0,
    totalDebitPiasters,
    totalCreditPiasters,
    errors,
  };
}

export function createReversalLines(lines: JournalLine[]): JournalLine[] {
  return lines.map((line) => ({
    ...line,
    debitPiasters: line.creditPiasters,
    creditPiasters: line.debitPiasters,
    memo: line.memo ? `عكس قيد: ${line.memo}` : 'عكس قيد محاسبي',
  }));
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameEn: string;
  accountType: Account['type'];
  debitPiasters: number;
  creditPiasters: number;
  netBalancePiasters: number;
}

export function computeTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  options: { includeDemo?: boolean; branchId?: string } = {}
): TrialBalanceRow[] {
  const posted = entries.filter((e) => {
    if (e.status !== 'posted' && e.status !== 'reversed') return false;
    if (!options.includeDemo && e.isDemo) return false;
    if (options.branchId && options.branchId !== 'all' && e.branchId !== options.branchId) {
      return false;
    }
    return true;
  });

  const totals = new Map<string, { debit: number; credit: number }>();
  for (const entry of posted) {
    for (const line of entry.lines) {
      const current = totals.get(line.accountId) ?? { debit: 0, credit: 0 };
      current.debit += line.debitPiasters;
      current.credit += line.creditPiasters;
      totals.set(line.accountId, current);
    }
  }

  return accounts.map((acc) => {
    const t = totals.get(acc.id) ?? { debit: 0, credit: 0 };
    const isDebitNormal =
      acc.type === 'asset' || acc.type === 'direct_cost' || acc.type === 'operating_expense';
    const netBalancePiasters = isDebitNormal ? t.debit - t.credit : t.credit - t.debit;
    return {
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      accountNameEn: acc.nameEn,
      accountType: acc.type,
      debitPiasters: t.debit,
      creditPiasters: t.credit,
      netBalancePiasters,
    };
  });
}

export interface FinancialStatementsSummary {
  totalRevenuePiasters: number;
  totalDirectCostPiasters: number;
  grossProfitPiasters: number;
  totalOperatingExpensePiasters: number;
  netProfitPiasters: number;
  totalAssetsPiasters: number;
  totalLiabilitiesPiasters: number;
  totalEquityPiasters: number;
  trialBalanceBalanced: boolean;
}

export function computeFinancialStatements(
  accounts: Account[],
  entries: JournalEntry[],
  options: { includeDemo?: boolean; branchId?: string } = {}
): FinancialStatementsSummary {
  const rows = computeTrialBalance(accounts, entries, options);

  let totalDebit = 0;
  let totalCredit = 0;
  let totalRevenuePiasters = 0;
  let totalDirectCostPiasters = 0;
  let totalOperatingExpensePiasters = 0;
  let totalAssetsPiasters = 0;
  let totalLiabilitiesPiasters = 0;
  let totalEquityPiasters = 0;

  for (const row of rows) {
    totalDebit += row.debitPiasters;
    totalCredit += row.creditPiasters;
    switch (row.accountType) {
      case 'revenue':
        totalRevenuePiasters += row.netBalancePiasters;
        break;
      case 'direct_cost':
        totalDirectCostPiasters += row.netBalancePiasters;
        break;
      case 'operating_expense':
        totalOperatingExpensePiasters += row.netBalancePiasters;
        break;
      case 'asset':
        totalAssetsPiasters += row.netBalancePiasters;
        break;
      case 'liability':
        totalLiabilitiesPiasters += row.netBalancePiasters;
        break;
      case 'equity':
        totalEquityPiasters += row.netBalancePiasters;
        break;
    }
  }

  const grossProfitPiasters = totalRevenuePiasters - totalDirectCostPiasters;
  const netProfitPiasters = grossProfitPiasters - totalOperatingExpensePiasters;

  return {
    totalRevenuePiasters,
    totalDirectCostPiasters,
    grossProfitPiasters,
    totalOperatingExpensePiasters,
    netProfitPiasters,
    totalAssetsPiasters,
    totalLiabilitiesPiasters,
    totalEquityPiasters,
    trialBalanceBalanced: totalDebit === totalCredit,
  };
}

export function calculateProjectContributionMargin(project: Project): {
  revenuePiasters: number;
  directCostsPiasters: number;
  contributionMarginPiasters: number;
  marginPercent: number;
} {
  const revenuePiasters = project.approvedRevenuePiasters;
  const directCostsPiasters = project.actualCostPiasters;
  const contributionMarginPiasters = revenuePiasters - directCostsPiasters;
  const marginPercent =
    revenuePiasters > 0
      ? Math.round((contributionMarginPiasters / revenuePiasters) * 1000) / 10
      : 0;
  return {
    revenuePiasters,
    directCostsPiasters,
    contributionMarginPiasters,
    marginPercent,
  };
}

export function computeInvoiceStatus(
  totalPiasters: number,
  paidPiasters: number,
  dueDateIso: string,
  referenceDateIso: string,
  isDraft = false
): Invoice['status'] {
  if (isDraft) return 'draft';
  if (paidPiasters >= totalPiasters && totalPiasters > 0) return 'paid';
  if (paidPiasters > 0 && paidPiasters < totalPiasters) {
    return dueDateIso < referenceDateIso ? 'overdue' : 'partial';
  }
  return dueDateIso < referenceDateIso ? 'overdue' : 'sent';
}

export function computeArAging(
  invoices: Invoice[],
  referenceDateIso: string
): {
  dueTodayPiasters: number;
  days1To30Piasters: number;
  days31To60Piasters: number;
  days61To90Piasters: number;
  over90DaysPiasters: number;
  totalOutstandingPiasters: number;
} {
  const refTime = new Date(referenceDateIso).getTime();
  let dueTodayPiasters = 0;
  let days1To30Piasters = 0;
  let days31To60Piasters = 0;
  let days61To90Piasters = 0;
  let over90DaysPiasters = 0;

  for (const inv of invoices) {
    if (inv.status === 'draft' || inv.status === 'paid' || inv.status === 'void') continue;
    const outstanding = Math.max(0, inv.totalPiasters - inv.paidPiasters);
    if (outstanding === 0) continue;

    const dueTime = new Date(inv.dueDate).getTime();
    const diffDays = Math.floor((refTime - dueTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      dueTodayPiasters += outstanding;
    } else if (diffDays <= 30) {
      days1To30Piasters += outstanding;
    } else if (diffDays <= 60) {
      days31To60Piasters += outstanding;
    } else if (diffDays <= 90) {
      days61To90Piasters += outstanding;
    } else {
      over90DaysPiasters += outstanding;
    }
  }

  return {
    dueTodayPiasters,
    days1To30Piasters,
    days31To60Piasters,
    days61To90Piasters,
    over90DaysPiasters,
    totalOutstandingPiasters:
      dueTodayPiasters +
      days1To30Piasters +
      days31To60Piasters +
      days61To90Piasters +
      over90DaysPiasters,
  };
}
