# BALANCE OS — Enterprise Business Operating System

**BALANCE OS** is the internal enterprise operating system for **BALANCE Agency** (Egypt · EGP · Arabic-first RTL + English LTR).

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons.
- **Backend**: Node.js + Express (`server.ts`) providing `/api/v1/health` and secure server-side Gemini AI endpoints (`/api/v1/ai/*`) verified via Firebase Admin ID tokens.
- **Database & Auth**: Firebase Firestore (`ai-studio-f52d82cf-957f-4dc8-ba99-4cac09e19bb1`) + Firebase Authentication (Google Sign-In, invite-only onboarding, hardened `firestore.rules`).
  - *Note on Cloud SQL*: Initial PostgreSQL provisioning via Cloud SQL returned `DEVELOPER_EDITION_QUOTA_PER_PROJECT_EXHAUSTED` (quota limit of 2 instances per project). Per environment policy, persistence was pivoted to Firebase Firestore while preserving the relational PostgreSQL schema specification in `docs/DATABASE_SCHEMA.md`.
- **AI Intelligence**: `BALANCE INTELLIGENCE` powered by `@google/genai` (`gemini-4-hydrogen`) running exclusively on the server side.

## Quick Commands

- `npm run dev` — Start Express + Vite dev server on port 3000.
- `npm run build` — Build frontend bundle.
- `npm run lint` — TypeScript strict check (`tsc --noEmit`).
- `npm run lint:rules` — Lint `firestore.rules` with `@firebase/eslint-plugin-security-rules`.
- `npx --yes tsx --test src/utils/*.test.ts` — Run unit tests for double-entry accounting, RBAC, and workflow validation.
