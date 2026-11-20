# BALANCE OS — Security Rules Specification & TDD Matrix

## 1. Core Data Invariants
1. **Master Gate & Verification**: Every operation requires `request.auth != null && request.auth.token.email_verified == true`. Unauthenticated and unverified access is strictly denied.
2. **RBAC & No Self-Escalation**: Users cannot assign or escalate their own `role` or `status` on `/users/{userId}` unless they are already an authenticated Founder/CEO (`sofianamr92@gmail.com`) or General Manager.
3. **PII & Payroll Isolation**: `/users/{userId}/private/{docId}` (salaries, national IDs, emergency contacts) and `/payrollRuns/{payrollId}` are strictly restricted to the owner (read-only for own payslip) or verified CEO / HR Manager / Accountant.
4. **Double-Entry & Terminal State Locking**: `/journalEntries/{entryId}` requires `totalDebitPiasters == totalCreditPiasters` and `totalDebitPiasters > 0`. Once `status == 'posted'`, a journal entry cannot be updated or deleted—only reversed via a new reversing entry or marked `reversed` by an authorized accountant/admin.
5. **Separation of Duties (SoD)**: On `/expenses/{expenseId}` and `/approvals/{approvalId}`, `approverUid != requesterUid` is enforced on approval transitions.
6. **Immutable Audit Logs**: `/auditLogs/{logId}` are append-only (`allow update, delete: if false;`).
7. **List Query Hardening**: Every `allow list` rule evaluates `resource.data` directly (zero `get()` or `exists()` inside `allow list` to prevent O(n) read amplification).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `GET /projects/proj-1` without `request.auth` -> DENIED.
2. **Unverified Email Write**: `CREATE /tasks/task-1` with `email_verified: false` -> DENIED.
3. **Self-Role Escalation**: `UPDATE /users/emp-1` by `emp-1` changing `role` from `'video_editor'` to `'ceo'` -> DENIED.
4. **Shadow Field Injection**: `CREATE /tasks/task-1` with extra ghost field `isSuperAdmin: true` -> DENIED (`hasOnly` check).
5. **ID Poisoning**: `CREATE /leads/invalid$id*with*1500chars` -> DENIED (`isValidId` regex & length `<= 128`).
6. **Temporal Spoofing**: `CREATE /tasks/task-1` with client-forged `createdAt` != `request.time` -> DENIED.
7. **Unbalanced Journal Entry**: `CREATE /journalEntries/je-1` with `totalDebitPiasters: 10000`, `totalCreditPiasters: 5000` -> DENIED.
8. **Posted Journal Mutation**: `UPDATE /journalEntries/je-posted` modifying `totalDebitPiasters` -> DENIED (terminal state lock).
9. **Self-Approval Fraud (SoD Bypass)**: `UPDATE /expenses/exp-1` where `requesterUid == request.auth.uid` setting `status: 'approved'` and `approverUid: request.auth.uid` -> DENIED.
10. **Cross-User PII Snooping**: `GET /users/other-uid/private/hr` by non-HR employee -> DENIED.
11. **Audit Log Tampering**: `DELETE /auditLogs/log-1` or `UPDATE /auditLogs/log-1` even by admin -> DENIED.
12. **Blanket List Scraping**: `LIST /payrollRuns` by a `freelancer` or `video_editor` -> DENIED.
