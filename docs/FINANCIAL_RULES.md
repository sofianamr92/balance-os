# BALANCE OS — Financial & Accounting Rules

1. **Integer Piasters**: All monetary fields use integer piasters (`amountPiasters`). Display formatting converts to `EGP` with Egyptian/Arabic locale (`tabular-nums`).
2. **Double-Entry Invariant**: Every Journal Entry must have `>= 2` lines and `Sum(Debit) === Sum(Credit) > 0`.
3. **Immutability**: Once a journal entry is `posted`, its lines and amounts cannot be altered or deleted. Corrections require a controlled **Reversal Entry** that flips debits and credits.
4. **Fiscal Period Lock**: New postings are blocked if the target `FiscalPeriod` has `status === 'closed'`.
5. **Separation of Duties**: Expense claims and payment approvals enforce `requesterUid !== approverUid`.
6. **Treasury Transfers**: Transfers between Cash/Bank accounts credit the source asset account and debit the destination asset account—never inflating revenue or operating expenses.
7. **Project Contribution Margin**: Calculated as `Recognized Project Revenue - Direct Project Costs`, explicitly distinct from Company Net Profit.
8. **Demo Data Isolation**: Records flagged `isDemo: true` are excluded from live production financial statements when running in production mode.
