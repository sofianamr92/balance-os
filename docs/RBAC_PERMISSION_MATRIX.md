# BALANCE OS — RBAC Permission Matrix & API Reference

## Roles
`ceo`, `general_manager`, `branch_manager`, `department_manager`, `team_leader`, `project_manager`, `accountant`, `hr_manager`, `sales_rep`, `photographer`, `video_editor`, `graphic_designer`, `marketing_specialist`, `developer`, `customer_support`, `freelancer`, `employee`

## Scoping Rules
- **Freelancer / Specialist**: Accesses only assigned tasks and projects where they are listed in `memberUids`; blocked from Payroll, Treasury, Company P&L, and unrelated clients.
- **Branch Manager**: Scoped to assigned `branchIds`; blocked from cross-branch confidential HR records.
- **Accountant**: Full Chart of Accounts, Journals, AR/AP, Treasury; blocked from private employee HR evaluations unless authorized.
- **Separation of Duties**: Requester cannot approve their own expense, leave, or procurement request.

## API Endpoints (`/api/v1`)
- `GET /api/v1/health` — Public runtime health check.
- `POST /api/v1/ai/chat` — Authenticated (`Authorization: Bearer <Firebase ID Token>`) Gemini `BALANCE INTELLIGENCE` assistant endpoint with role-scoped context and prompt-injection filtering.
- `POST /api/v1/ai/summarize` — Authenticated executive/project summary generator.
