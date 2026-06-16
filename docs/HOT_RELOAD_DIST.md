# Hot Reload — `dist/` Mode for ECOD Server

> **TL;DR** — Watch `src/**` → compile incrementally with `tsc --watch` → restart
> `node dist/server.js` automatically via `nodemon`. No `tsx`, no ts-node at runtime.

---

## Why Two Modes Exist

| Mode | Command | How it runs | Best for |
|------|---------|-------------|----------|
| **Dev (tsx)** | `pnpm dev` | `nodemon + tsx server.ts` — interprets TS directly | Day-to-day feature work |
| **Dist (compiled)** | _(see below)_ | `tsc --watch` → `nodemon dist/server.js` | Production parity testing, debugging compiled output |

The dist mode is useful when you need to verify that:
- Path aliases (`@/*`, `@services/*`, etc.) resolve correctly after `tsc-alias` rewrites.
- The compiled JS behaves identically to what ships to production.
- A specific bug only reproduces in compiled output.

---

## How Hot Reload on `dist/` Works

```
src/**/*.ts  ──(tsc --watch)──▶  dist/**/*.js
                                       │
                              nodemon watches dist/
                                       │
                              restarts node dist/server.js
```

Two processes run in parallel:

1. **`tsc --watch`** — TypeScript compiler in watch mode. Emits incrementally to `dist/` on every save.
2. **`nodemon`** — Watches `dist/` for `.js` file changes, then restarts `node dist/server.js`.

---

## Setup

### 1 — Add the script to `package.json`

Add this script under `"scripts"` in [package.json](../package.json):

```json
"dev:dist": "tsc -p tsconfig.build.json --watch --preserveWatchOutput & nodemon --watch dist --ext js --delay 1500ms dist/server.js"
```

**Why `--delay 1500ms`?**  
`tsc` emits files incrementally — not all at once. Without a delay, `nodemon` may restart
on the *first* emitted file before the rest of the compiled output is written, causing a
stale-module error. `1500ms` gives `tsc` enough time to flush the full incremental build.

**Why `--preserveWatchOutput`?**  
Keeps `tsc` watch output visible without clearing the terminal on each recompile.

---

### 2 — Build `dist/` once before starting

The very first run requires a full compile. On a fresh clone or after a clean:

```bash
pnpm build        # tsc -p tsconfig.build.json && tsc-alias -f
```

After that, `tsc --watch` takes over and keeps `dist/` up to date.

---

### 3 — Run

```bash
pnpm dev:dist
```

You will see two concurrent streams:

```
[tsc] Starting compilation in watch mode...
[tsc] Found 0 errors. Watching for file changes.
[nodemon] starting `node dist/server.js`
[server] 🚀 ECODrIx API ready on :4000
```

Save any file under `src/` → `tsc` recompiles → `nodemon` restarts automatically.

---

## Path Aliases After Compilation

`tsconfig.json` maps paths like `@/*` → `./src/*`. After `tsc` compiles, those
imports still reference the alias strings in the emitted JS — they don't resolve
in Node without help.

**`tsc-alias`** rewrites them to real relative paths. In watch mode:

```json
"dev:dist": "tsc -p tsconfig.build.json --watch --preserveWatchOutput & nodemon --watch dist --ext js --delay 1500ms dist/server.js"
```

> ⚠️ `tsc --watch` alone does **not** run `tsc-alias`. Alias rewrites only happen in
> `pnpm build` (which explicitly runs `tsc-alias -f` after `tsc`).
>
> **If your server crashes on `Cannot find module '@/...'`** in dist mode, the fix is
> to add `tsc-alias --watch` as a third concurrent process:

```json
"dev:dist": "tsc -p tsconfig.build.json --watch --preserveWatchOutput & tsc-alias -p tsconfig.build.json --watch & nodemon --watch dist --ext js --delay 2000ms dist/server.js"
```

Run a quick check first — if your `dist/server.js` uses relative paths after `pnpm build`,
`tsc-alias` is doing its job. If it still uses `@/`, add the watcher above.

---

## Concurrently (Cleaner Alternative)

If you dislike background `&` chains, use `concurrently` (already common in monorepos):

```bash
pnpm add -D concurrently   # only if not already installed
```

```json
"dev:dist": "concurrently --kill-others-on-fail -n tsc,alias,node -c cyan,blue,green \"tsc -p tsconfig.build.json --watch --preserveWatchOutput\" \"tsc-alias -p tsconfig.build.json --watch\" \"nodemon --watch dist --ext js --delay 2000ms dist/server.js\""
```

This gives each process its own labeled, color-coded output stream.

---

## Comparison: `pnpm dev` vs `pnpm dev:dist`

| | `pnpm dev` | `pnpm dev:dist` |
|---|---|---|
| **Runtime** | `tsx` (interprets TS) | `node` (pure JS from `dist/`) |
| **Alias resolution** | Handled by `tsx` at runtime | Must go through `tsc-alias` |
| **Restart speed** | Faster (no compile step) | ~1–2 s (incremental `tsc`) |
| **Production parity** | ❌ Not identical | ✅ Runs exactly what ships |
| **Source maps** | Built-in via `tsx` | None (set `sourceMap: true` in tsconfig.build.json to enable) |
| **Use when** | Normal development | Debugging compiled behavior |

---

## Quick Reference

```bash
# One-time full build (required on first run or after clean)
pnpm build

# Start hot-reload on dist/
pnpm dev:dist

# If you need a completely clean dist/ slate
rm -rf dist && pnpm build
```

---

## Troubleshooting

### `Cannot find module '@/...'` in dist/
→ Path aliases weren't rewritten. Add `tsc-alias --watch` to `dev:dist` (see above).

### `nodemon` restarts too fast / crashes mid-boot
→ Increase `--delay` to `2500ms` or `3000ms` for larger codebases.

### `tsc --watch` not picking up new files
→ New files in directories not matched by `tsconfig.build.json`'s `include`. Verify the
glob covers your new path.

### Port already in use on restart
→ The previous `node` process didn't exit cleanly. `nodemon` sends `SIGTERM`; ensure your
server listens for it and shuts down gracefully (most Express setups do by default).

### `dist/server.js` not found
→ Run `pnpm build` first. `tsc --watch` will then keep it updated.
