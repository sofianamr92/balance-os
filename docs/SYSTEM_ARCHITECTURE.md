# BALANCE OS — Technical & System Architecture

## 1. Environment & Storage Strategy
- **Runtime**: Node.js v22, Express 4, Vite 8, React 19, TypeScript, Tailwind CSS v4.
- **Primary Database**: Firebase Firestore (`ai-studio-f52d82cf-957f-4dc8-ba99-4cac09e19bb1`). Cloud SQL PostgreSQL is not provisioned in this environment; therefore Firestore is the active persistent store and `docs/DATABASE_SCHEMA.md` maintains the normalized PostgreSQL blueprint for future relational migration.
- **Authentication**: Firebase Auth (Google Sign-In via `signInWithPopup`) with server-side ID token verification (`firebase-admin/auth` `verifyIdToken`) on `/api/v1/ai/*` routes.
- **Demo Sandbox Isolation**: Preview/demo mode operates in isolated in-memory state (`isDemo: true`) and never writes demo transactions into production financial ledgers unless explicitly toggled by an administrator.

## 2. Module Boundaries
- `src/types/os.ts` — Canonical Single Source of Truth domain contracts (26 modules, 17 roles).
- `src/utils/accounting.ts` — Pure double-entry bookkeeping engine (integer piasters, balanced debits/credits, trial balance, P&L, balance sheet, AR aging).
- `src/utils/rbac.ts` — Role-based permission checks, branch/department/assigned scoping, PII masking, Separation of Duties.
- `src/utils/workflows.ts` — Lead deduplication, equipment double-booking guard, project completion gates, idempotent automation triggers.
- `src/utils/studio3d.ts` & `src/components/three/*` — Interactive Three.js 3D Production Studio & Operations Twin with procedural PBR geometry, live telemetry `CanvasTexture`s, and software-WebGL protection.
- `src/components/pwa/*` & `vite.config.ts` — Offline-ready Progressive Web App (`vite-plugin-pwa`, Web App Manifest, Service Worker caching, install prompt).
- `server.ts` & `src/server/` — Authenticated Express API + Gemini `BALANCE INTELLIGENCE` proxy (`GEMINI_API_KEY` kept strictly server-side).
