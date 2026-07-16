@AGENTS.md

# FilterPass Mobile — Agent Guidelines

## Expo & React Native

- Target **Expo SDK 57** (`expo ~57.0.6`). Read versioned docs before writing code: https://docs.expo.dev/versions/v57.0.0/
- App routes live in `src/app/` (Expo Router). Shared UI in `src/components/` (`ui/`, `layout/`, `charts/`). Feature code in `src/features/<name>/` (`screens/`, `components/`). Domain types in `src/types/`, mock data in `src/mocks/`.
- Theme tokens: `src/theme/tokens.ts`, typography: `src/theme/typography.ts`.
- Prefer existing components (`AppShell`, `Card`, `Button`, etc.) over one-off markup.
- Avoid native modules that crash in **Expo Go** unless verified (e.g. `@shopify/react-native-skia` with layer blur caused SIGSEGV — use `expo-linear-gradient` or a dev build instead).
- `babel.config.js` must include `react-native-reanimated/plugin` (last in plugins list).

## Backend API

**Authoritative reference: [`docs/api.md`](docs/api.md)**

Use it for all REST and WebSocket contracts (sessions, `/ws/frames`, `/ws/output`, message shapes, errors, defaults). Do not guess endpoint fields or payload formats — read the doc first.

### Client layout

- `src/api/` — HTTP client (`client.ts`), REST modules (`health`, `sessions`, `history`), WebSocket helpers (`ws/frames`, `ws/output`).
- `src/types/api.ts` — wire types mirroring `docs/api.md`.
- `src/config/env.ts` — `EXPO_PUBLIC_API_URL` (default `http://localhost:8000`) and derived `apiWsBaseUrl`.
- Feature hooks call `@/api`; screens do not call `fetch` directly.
- `src/mocks/` — fixture data for offline dev/tests only; production screens use hooks + API.

**Env:** copy `.env.example` to `.env`. Android emulator may need `http://10.0.2.2:8000`; physical devices need your machine's LAN IP.

## Git commits

**Always commit code changes** so work is tracked incrementally.

- **One logical change per commit** — fix, feature slice, or refactor; not a giant “everything” commit.
- Commit message: short imperative subject (e.g. `Fix Expo Go crash by replacing Skia blobs`), optional body for why.
- Do not commit secrets (`.env`, credentials).
- Do not amend pushed commits or skip hooks unless explicitly asked.

Example split: UI shell in one commit, API client in another, crash fix in another.

## Scope & quality

- Minimize diff scope; match surrounding naming and patterns.
- Comments only for non-obvious logic.
- Run `npx expo start` / relevant checks after meaningful changes when possible.
