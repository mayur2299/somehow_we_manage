# Somehow We Manage — CREATE 2026

Hackathon build. Nuxt 4 for both frontend (`app/`) and backend (`server/`), deployed to the
organiser-provided Netlify project.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000. The index page calls `/api/health` to prove the server side works.

## Layout

- `app/pages/` — routes (file-based)
- `app/components/` — Vue components
- `server/api/` — backend endpoints, become Netlify Functions on deploy
- `server/utils/` — server-only helpers (auto-imported in `server/`)
- `public/` — static files
- `docs/` — playbook, rules, submission guidelines

## Deploy

Netlify builds from the linked Git repo. `netlify.toml` sets the build command and publish dir.
Secrets go in Netlify → Site settings → Environment variables as `NUXT_*` vars, never in code.
