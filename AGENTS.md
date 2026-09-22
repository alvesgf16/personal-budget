# Personal Budget (PB) — agent notes

## Project

- Jira project: **PB** on [alvesgf.atlassian.net](https://alvesgf.atlassian.net)
- Stack: **Angular web, local-only** (no cloud API, no native shell in v1)
- Persistence: **document store, not SQL** (Dexie / IndexedDB — later tickets)

## Working style

- **One Jira story per session** — do not mix Foundation tasks or feature stories
- Node **24 LTS** (from PB-13 scaffold)
- Before finishing a ticket: `npm run lint` and `npm test` must pass

## Commits

- Conventional Commits (`feat:`, `fix:`, `chore:`, …)
- Put the Jira key in the **commit body**, not the summary
- Husky rejects bad messages and staged lint/format failures
