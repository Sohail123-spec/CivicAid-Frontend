# CivicAid frontend

React + Vite frontend for the CivicAid Assistive Technology Access and Lifecycle Platform. This frontend is integrated with the existing Spring Boot API; it does not ship mock catalogue records.

## Requirements

- Node.js 22.22+ recommended (the locked React Router version declares this minimum).
- npm.
- CivicAid backend running or deployed.

## Local development

From this directory:

```powershell
npm ci
$env:VITE_API_BASE_URL = "http://localhost:8080/api"
npm run dev
```

Open the Vite URL printed in the terminal. If you use a different backend port or host, change `VITE_API_BASE_URL`. The value must include `/api`.

## Validate before pushing

```powershell
npm ci
npm run lint
npm run build
```

Commit `package-lock.json`; do not commit `node_modules`, `dist`, `.env`, tokens, or credentials.

## Production deployment

Configure `VITE_API_BASE_URL` in the static-site host's build environment, for example `https://YOUR-BACKEND-HOST/api`. It is a public API base URL, not a secret. Never put database credentials or JWT signing secrets in frontend environment variables. Rebuild after changing it because Vite embeds `VITE_*` variables at build time.

Configure the static host to serve `index.html` for unknown paths (SPA fallback) so direct navigation/refresh on `/discover`, `/schemes/:schemeId`, `/providers`, `/lifecycle`, and `/saved` works. `public/_redirects` provides the standard Netlify-style fallback; other hosts may need an equivalent rewrite rule.

If the browser reports CORS errors, configure the backend's existing CORS policy to allow the deployed frontend origin. Do not weaken authentication or admin authorization to work around CORS.

## Implemented user journeys

- Public AT discovery and product detail, with source/verification metadata and need mappings.
- Public scheme discovery and scheme detail.
- Public provider and service-location discovery, search/filter, map pins for reviewed coordinates, contact details, and source/verification information.
- Registration, login, protected profile/dashboard, and functional-needs questionnaire.
- Personal saved-resource list and save/remove actions.
- Personal device lifecycle records, maintenance history, and repair history.

Public lists reflect backend verification and freshness rules. Empty results are shown as empty; the frontend does not fabricate resources or bypass verification.
