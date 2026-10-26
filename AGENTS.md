# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, OpenCode, pi, …) working in this repository.
`CLAUDE.md` only imports this file (`@AGENTS.md`); edit this file, not `CLAUDE.md`.

## What this is

`fp-space` is a functional space-shooter game-logic library (published to npm) plus a terminal game. It sits in the afrontend game stack:

```
fp-panel (npm) → fp-space (this repo, npm)
```

Unlike tetris/block/snake, there is **no React web app** for it — the terminal game in `src/example.js` is the only frontend.

## Commands

```sh
npm test            # ESLint (pretest) then vitest run
npm run test:watch  # vitest in watch mode
npm start           # terminal game (node ./src/example.js)
npm run demo-gif    # record demo.cast/demo.gif (scripts/make-demo.sh, asciinema + agg)
npx vitest run lib/__tests__/fpSpace.test.js   # single test file
```

ESLint + Prettier are configured in `eslint.config.js`; `pretest` runs ESLint, so lint errors block tests.

## Layout

- `lib/index.js` — the library (CJS, hand-written source, not build output)
- `lib/__tests__/` — vitest tests; `compatibility.test.js` pins the shared API contract
- `src/example.js` — terminal game (chalk + keypress)
- `scripts/autoplay.js`, `scripts/make-demo.sh` — automated play for the demo GIF
- `.github/workflows/demo.yml` — on push to `master`, regenerates the demo GIF (asciinema/agg are pinned by version + sha256; bump both together)
- `.github/workflows/test.yml` — `npm test` on push to `master` and on PRs (incl. Dependabot)
- Actions are pinned to commit SHAs with a `# vN` comment and updated via Dependabot (`.github/dependabot.yml`: github-actions + npm, monthly); keep the SHA pin when editing by hand. CI runs Node 24.

## Architecture

State machine on top of `fp-panel`. All transitions are pure and return a new state object. `join` composes `missilePanel`, `shuttlePanel`, and `meteoritePanel`.

Shared API (same shape across fp-tetris / fp-block / fp-snake / fp-space / fp-sokoban):

| Export | Description |
|---|---|
| `init({ rows, columns })` | Initial state; `init(rows, columns)` still accepted for compatibility |
| `tick(state)` | Advance one frame |
| `key(keyName, state)` | Input: `'left'`, `'right'`, `'up'` (fire), `'space'` (pause toggle); other keys are ignored |
| `join(state)` | Merge panels into one renderable panel |
| `toArray`, `isBlank`, `getTickInterval` | Rendering / timing helpers |
| `serializeState` / `restoreState` | Save / load |

Missiles are drawn `yellow` by convention.
