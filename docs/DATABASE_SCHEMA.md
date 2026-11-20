# BALANCE OS — Database Schema & Relational Blueprint

## Active Persistent Schema (Firestore)
Canonical IR is maintained in `/firebase-blueprint.json` and enforced by `/firestore.rules`.
Monetary values are stored strictly as **integer piasters** (`1 EGP = 100 Piasters`) to eliminate floating-point rounding drift.

## Target PostgreSQL Schema Mapping (Migration Ready)
1. **Organization**: `companies`, `branches`, `departments`, `teams`, `users`, `roles`, `invitations`
2. **CRM & Sales**: `clients`, `leads`, `deals`, `proposals`, `contracts`, `services`
3. **Projects & Tasks**: `projects`, `tasks` (with checklists, revisions, dependencies)
4. **Creative Operations**: `shoots`, `equipment_reservations`, `editing_jobs`, `design_jobs`, `marketing_items`, `dev_items`
5. **Finance & Accounting**: `chart_of_accounts`, `fiscal_periods`, `journal_entries` (immutable once `posted`), `invoices`, `payments`, `expenses`, `treasury_accounts`, `treasury_transfers`, `procurement_requests`, `assets`
6. **HR & Support**: `attendance_records`, `leave_requests`, `payroll_runs`, `support_tickets`
7. **Shared Services**: `files`, `knowledge_articles`, `workflows`, `workflow_logs`, `approvals`, `notifications`, `audit_logs`
