# MyEcclesia

Monorepo for the MyEcclesia project, using [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io) workspaces.

## Repository structure

```
├── apps/
│   ├── vite/       # Vite + React + shadcn (main app)
│   └── nextjs/     # Next.js app
├── packages/       # Shared packages (optional)
├── supabase/       # Backend (migrations, functions)
├── package.json    # Root workspace scripts
├── pnpm-workspace.yaml
└── turbo.json
```

- **`apps/vite`** — Vite, React 18, TypeScript, shadcn-ui, Tailwind. Deployed to Netlify.
- **`apps/nextjs`** — Next.js 16, React 19, Tailwind 4.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/installation) — `corepack enable && corepack prepare pnpm@latest --activate` or install via npm/nvm.

## Getting started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd myecclesia

# Install dependencies (all workspace packages)
pnpm install

# Run all apps in development (Turborepo runs both)
pnpm run dev
```

## Scripts (from repo root)

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Run all apps in dev (Turbo) |
| `pnpm run build` | Build all apps |
| `pnpm run lint` | Lint all apps |
| `pnpm run dev:vite` | Run only the Vite app (e.g. port 8080) |
| `pnpm run dev:nextjs` | Run only the Next.js app (port 3001) |
| `pnpm run build:vite` | Build only the Vite app |
| `pnpm run build:nextjs` | Build only the Next.js app |

## Technologies

- **Vite app:** Vite, React, TypeScript, shadcn-ui, Tailwind CSS, Supabase
- **Next.js app:** Next.js, React, TypeScript, Tailwind CSS
- **Tooling:** Turborepo, pnpm workspaces

## Project info (Lovable)

**URL**: https://lovable.dev/projects/e5e870cb-02f1-40d4-b547-a78e6e011e75

You can edit the Vite app via [Lovable](https://lovable.dev/projects/e5e870cb-02f1-40d4-b547-a78e6e011e75); changes are committed to this repo. To deploy, use Lovable Share → Publish or your own pipeline (e.g. Netlify building `apps/vite`).

## Custom domain

To connect a custom domain in Lovable: Project → Settings → Domains → Connect Domain. See [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide).
