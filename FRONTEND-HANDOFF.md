# Frontend handoff — 2026-10-13

This folder extends the existing CivicAid frontend without replacing the backend or fabricating public catalogue data.

## Included

- Existing home, login/register, profile, dashboard, functional-needs questionnaire, AT discovery/product detail, and schemes pages.
- Scheme detail route wiring.
- Public provider/service discovery with filters and map support for returned coordinates.
- Saved-resource save/list/remove flow.
- Personal lifecycle records with maintenance and repair records.
- Admin verification for schemes and providers only.
- Production-safe API base fallback and deployment notes.

## Before submission

From this folder in PowerShell:

```powershell
npm ci
npm run lint
npm run build
```

Configure `VITE_API_BASE_URL` in the hosting platform's build environment. For a separately deployed Spring Boot API, use the backend's public base URL ending in `/api`. Also configure the static host's SPA rewrite and backend CORS allowlist.

## Important limitations

- Syntax parsing was performed on all source JS/JSX files; no syntax errors were reported.
- ESLint and Vite build were not run because package installation timed out in this environment. Do not treat this as a confirmed production build.
- Admin verification UI covers schemes and providers. Admin list endpoints for unverified AT categories/products were not available in the inspected backend controller set, so these admin lists were not faked.
- Public discovery is governed by backend verification/freshness rules. Empty results are intentional when no eligible records exist.
