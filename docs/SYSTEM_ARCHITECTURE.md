# BALANCE OS — Technical & System Architecture

## 1. Environment & Storage Strategy
- **Runtime**: Node.js v22, Express 4, Vite 8, React 19, TypeScript.
- **Primary Database**: Firebase Firestore (`unified-pad-4gt36` / `ai-studio-f52d82cf-957f-4dc8-ba99-4cac09e19bb1`). Cloud SQL PostgreSQL provisioning hit `DEVELOPER_EDITION_QUOTA_PER_PROJECT_EXHAUSTED`; therefore Firestore is the active persistent store and `docs/DATABASE_SCHEMA.md` maintains the normalized PostgreSQL blueprint for future migration.
- **Authentication**: Firebase Auth (Google Sign-In via `signInWithPopup`) with server-side ID token verification (`firebase-admin/auth` `verifyIdToken`) on `/api/v1/ai/*` routes.
- **Demo Sandbox Isolation**: Preview/demo mode (`?autostart=1` or explicit Demo Preview toggle) operates in isolated in-memory state (`isDemo: true`) and never writes demo transactions into production financial ledgers.

## 2. Module Boundaries
- `src/types/os.ts` — Canonical Single Source of Truth domain contracts.
- `src/utils/accounting.ts` — Pure double-entry bookkeeping engine (integer piasters, balanced debits/credits, trial balance, P&L, balance sheet, AR aging).
- `src/utils/rbac.ts` — Role-based permission checks, branch/department/assigned scoping, PII masking, Separation of Duties.
- `src/utils/workflows.ts` — Lead deduplication, equipment double-booking guard, project completion gates, idempotent automation triggers.
- `server.ts` & `src/server/` — Authenticated Express API + Gemini `BALANCE INTELLIGENCE` proxy.
