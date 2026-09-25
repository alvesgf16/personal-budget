# Personal Budget

Angular web SPA for personal budgeting. Local-only (no cloud API in v1). Jira project: **PB**.

See [AGENTS.md](AGENTS.md) for agent and contributor conventions.

## Prerequisites

- Node **24 LTS**
- npm (workspace uses `npm@11.19.0`)

## Scripts

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `npm start`      | Dev server at `http://localhost:4200/` |
| `npm test`       | Unit tests (Vitest, single run)        |
| `npm run lint`   | ESLint + Prettier check                |
| `npm run format` | Prettier write                         |
| `npm run build`  | Production build → `dist/`             |

## Git hooks

Husky runs on every commit and push:

- **pre-commit** — lint-staged (ESLint `--fix` + Prettier on staged files)
- **commit-msg** — Conventional Commits via commitlint
- **pre-push** — rejects direct pushes to `main` (use a feature branch and open a PR)

Bad commit messages, unresolved lint errors, or a direct push to `main` are rejected locally.

## Repository and CI

Public repo: [github.com/alvesgf16/personal-budget](https://github.com/alvesgf16/personal-budget).

On every push to `main` and every pull request, GitHub Actions runs:

- `npm run lint`
- `npm test`
- `npm run build` (production)

**Never commit user budget data** (IndexedDB dumps, local exports, or anything under ignored dump paths). Persistence is browser-local only.

## Data model notes

Categories live in the document store collection `categories` (`COLLECTIONS.categories`). That list is the source of truth for Plan category rows **and** for later Tracking assignment dropdowns — Tracking must not grow a second catalog.
