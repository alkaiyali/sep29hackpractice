# Meddy — working agreement

> Read this before touching the repo. It is the **completion protocol**.

## The one rule

**Every completed unit of work ends with `npm run ship "type: summary"`** — agent or human, same rule. A *completion* is one coherent change that builds. Never ship a half-applied refactor: if you've rewritten a service but haven't yet updated its call sites, that is **not** a completion.

## Shipping

```bash
npm run ship "feat: seed demo data"            # stage everything, commit, push
npm run ship "fix: pdf header" src/services    # stage only those paths
npm run ship:push                              # push only (recovery / hooks)
```

`ship` commits, then pushes to `origin/<current-branch>`. It rebases on the remote first (with `--autostash`) and retries once, so simultaneous pushes don't clobber each other. A failed push never loses the commit.

## What runs automatically

Hooks are versioned in `.githooks/` and activated through `core.hooksPath`, which `npm install` sets for you (the `prepare` script):

| Hook | Does | On failure |
|---|---|---|
| `pre-commit` | refuses to commit `.env` / keystores; runs `npx tsc --noEmit` when `.ts`/`.tsx` changed | blocks the commit |
| `post-commit` | pushes to origin | warns loudly; commit stays safe locally |

Bypass once with `SKIP_VERIFY=1 git commit ...` — for documentation-only or emergency commits, never to land broken code.

Fresh clone: `npm install` wires the hooks. Manually: `git config core.hooksPath .githooks`.

## Before you ship

1. `npx tsc --noEmit` clean — the hook enforces this too
2. Backend touched? `npm run firebase:smoke` — 12 live checks against `onlypills-b105c`
3. Models, stores, screens or deps changed? Update `Context/` — that is the repo's SSOT rule (`Context/05`) and **part of the completion**
4. Visible UI changed? Confirm the app actually **runs**, not merely compiles — `npx expo start --web` and load it

## Never

- Never commit `.env` (gitignored; `.env.example` is the template)
- Never push from a detached HEAD
- Never leave a completion uncommitted at the end of a session
- Never delete or rewrite someone else's work to make a gate pass
