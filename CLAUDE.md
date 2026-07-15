@AGENTS.md

# FilterPass Mobile — Agent Guidelines

## Expo & React Native

- Target **Expo SDK 57** (`expo ~57.0.6`). Read versioned docs before writing code: https://docs.expo.dev/versions/v57.0.0/
- App routes live in `src/app/` (Expo Router). Shared UI in `src/components/filterpass/`. Feature screens in `src/features/`.
- Theme tokens: `src/theme/tokens.ts`, typography: `src/theme/typography.ts`.
- Prefer existing components (`AppShell`, `Card`, `Button`, etc.) over one-off markup.
- Avoid native modules that crash in **Expo Go** unless verified (e.g. `@shopify/react-native-skia` with layer blur caused SIGSEGV — use `expo-linear-gradient` or a dev build instead).
- `babel.config.js` must include `react-native-reanimated/plugin` (last in plugins list).

## Backend API

**Authoritative reference: [`docs/api.md`](docs/api.md)**

Use it for all REST and WebSocket contracts (sessions, `/ws/frames`, `/ws/output`, message shapes, errors, defaults). Do not guess endpoint fields or payload formats — read the doc first.

When wiring real API calls, align mobile types and mock data in `src/mocks/` with the shapes documented there.

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
