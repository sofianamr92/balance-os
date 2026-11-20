# BALANCE OS — Enterprise Business Operating System

Internal enterprise operating system for **BALANCE Agency (Egypt · EGP)** covering CRM & Sales, Clients, Proposals & Contracts, Projects & Tasks, Media Production, **3D Studio & Operations Twin (Three.js)**, Video Editing, Graphic Design, Marketing, Development, Double-Entry Accounting, Procurement & Assets, HR & Hybrid Attendance, Customer Support, File Library, Knowledge Base, Automation, and **BALANCE INTELLIGENCE (Gemini AI)**, with full **PWA** installability and bilingual **Arabic RTL / English LTR** support.

## Architecture Overview
- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS v4, Recharts, Three.js (`RoomEnvironment`, procedural PBR geometry, `OrbitControls`, `Raycaster`), `vite-plugin-pwa`.
- **Backend**: Express (`server.ts`), Firebase Admin ID-token verification (`src/server/firebase-admin.ts`), server-side `@google/genai` proxy (`src/server/ai-service.ts`).
- **Database & Auth**: Firebase Authentication (Google Workspace) + Cloud Firestore (`firebase-blueprint.json`, `firestore.rules`).

## Environment Variables
Configure in AI Studio Secrets / `.env` (never commit real secrets):
- `GEMINI_API_KEY`: Required on the backend for `/api/v1/ai/*` endpoints.
- `APP_URL`: Runtime Cloud Run / hosting URL.

## Project Directory Structure
- `src/assets/` — Brand SVG assets & `BRAND_ASSETS` registry
- `src/components/` — Reusable UI (`common`, `layout`, `auth`, `pwa`, `three`)
- `src/contexts/` (and `src/context/`) — Global state & Firebase/Demo Sandbox provider (`OSContext`)
- `src/hooks/` — Custom hooks (`usePermissions`, `useCurrencyFormat`, `useBranchScope`, `useDebounce`)
- `src/services/` — Client service facades (`aiService`, `firebaseService`, `exportService`)
- `src/types/` — Domain TypeScript definitions (`os.ts`)
- `src/utils/` — Pure accounting, RBAC, workflow, and 3D scene utilities + tests
- `src/pages/` — Module pages mapped to Express/React Router endpoints

## Verification Commands
```bash
npm run lint
npm run build
npm run lint:rules
npx --yes tsx --test src/utils/accounting.test.ts src/utils/workflows.test.ts src/utils/studio3d.test.ts src/services/aiService.test.ts
```

## Documentation
- `/docs/SYSTEM_ARCHITECTURE.md`
- `/docs/DATABASE_SCHEMA.md`
- `/docs/FINANCIAL_RULES.md`
- `/docs/RBAC_PERMISSION_MATRIX.md`
