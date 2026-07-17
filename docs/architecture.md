# Architecture

How FilterPass Mobile is organized and how live audio reaches the detector.

## Product shape

Mobile client for **session-scoped spoof detection**:

1. Create a session over REST (`POST /sessions`).
2. Open two WebSockets: frames in, scores out.
3. Stream PCM16 mono audio.
4. Show warmup → live scores → history/settings around that loop.

Capture modes on Live:

| Mode          | Source                                                         | Runtime requirement                                       |
| ------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| **Mic**       | `expo-audio` `useAudioStream`                                  | Expo Go or dev build                                      |
| **Call Scan** | Local module `filterpass-call-capture` (mixed mic + call-path) | Android dev client / sideload APK + Accessibility enabled |

Backend contract: [`api.md`](./api.md). Stack versions: [`tech-stack.md`](./tech-stack.md). Call Scan detail: [`call-capture.md`](./call-capture.md).

## Layering

```
src/app/(tabs)/*          routes only — compose feature screens/hooks
src/features/<name>/      screens, components, hooks for a domain
src/api/                  HTTP + WS fetchers — no UI
src/queries/              TanStack Query keys, options, mutations
src/components/           shared presentational UI
src/lib/                  pure helpers
src/config/               env
src/types/                shared types (Zod-inferred wire types)
modules/*                 local Expo native modules (Android Kotlin)
```

Rules of thumb:

- Screens do **not** call `fetch` / open sockets directly; feature hooks use `@/api` / `@/queries`.
- Prefer existing `AppShell`, `Card`, `Button`, charts over one-off chrome.
- Wire types and Zod schemas stay aligned with `docs/api.md`.
- **Server state (REST):** TanStack Query (`src/queries/`) — see [`react-query-migration.md`](./react-query-migration.md). Live WS/PCM stay imperative.

## Data fetching

| Concern | Implementation |
| ------- | -------------- |
| REST cache | `@tanstack/react-query` via `src/queries/*` |
| History pages | `useInfiniteQuery` (`historySessionsInfiniteOptions`) |
| `/health` | `useQuery` + `BackendHealthProvider` façade |
| Session report | `useQueries` (session + inferences) |
| Home overview | `useQueries` (shared health/history/bucket keys) |
| Session defaults | `useQuery` + mutations over AsyncStorage |
| Live WS / PCM | `useLiveSession` (imperative) |


## Feature map

| Feature  | Path                    | Responsibility                                |
| -------- | ----------------------- | --------------------------------------------- |
| Home     | `src/features/home`     | Overview KPIs, CTA into Live                  |
| Live     | `src/features/live`     | Session lifecycle, mic/call capture, score UI |
| History  | `src/features/history`  | Past sessions list/detail                     |
| Settings | `src/features/settings` | Persisted session defaults (AsyncStorage)     |
| Health   | `src/features/health`   | Backend readiness gate (`/health`)            |

## Live session flow

Central hook: `useLiveSession` (`src/features/live/hooks/useLiveSession.ts`).

Internals (keep screens on the facade):

| Piece | Path | Role |
| ----- | ---- | ---- |
| Types | `features/live/types.ts` | Phase, capture mode, Call Scan setup |
| Reducer | `features/live/domain/liveSessionReducer.ts` | Pure output/frames → metrics/phase |
| Dual WS | `features/live/session/connectLiveSession.ts` | Open frames+output atomically |
| Mic | `features/live/capture/useMicCapture.ts` | expo-audio adapter |
| Call | `features/live/hooks/useCallCapture.ts` | Native module + Accessibility |

```
idle
  → start()
connecting
  → ensureReady (/health)
  → mic permission + audio mode
  → POST /sessions
  → connectLiveSession (/ws/output + /ws/frames)
  → start capture (mic OR call)
warmup (first output "warmup")
active (first output "score")
  → stop / error / WS close → teardown → idle
```

### Capture seam

Both modes push `ArrayBuffer` PCM into `connectFramesSocket(...).sendPcm`:

```
Mic:   expo-audio onBuffer → ArrayBuffer → sendPcm
Call:  native onPcm (base64) → base64ToArrayBuffer → sendPcm
```

`captureMode: 'mic' | 'call'` selects the path. Call mode refreshes Accessibility status and refuses start until the service is enabled **and** connected.

### Output handling

`/ws/output` JSON:

- `warmup` → buffer fill UI
- `score` → gauge, sparkline, labels (`REAL` / `UNCERTAIN` / `SPOOF`)
- `error` → hard teardown

`/ws/frames` acks update frame counters; frame soft errors stay connected (per API doc).

## Call Scan native pipeline

Module: `modules/filterpass-call-capture`

```
AccessibilityService (gate)
        │
FilterpassCallCaptureModule.start(sampleRate)
        │
DualCaptureEngine
  ├─ AudioRecordWorker "mic"   (MIC → …)
  └─ AudioRecordWorker "call"  (VOICE_COMMUNICATION → fallbacks)
        │
  resample → 100 ms frames → PcmFrameAligner (mix / passthrough)
        │
  emit onPcm { data: base64, sampleRate: 16000, byteLength }
        │
useCallCapture → useLiveSession → /ws/frames
```

Design intent: **best-effort** mixed mono. Client does not gate on silence or far-end quality; backend decides.

## Config & environments

| Concern                   | Location                                                  |
| ------------------------- | --------------------------------------------------------- |
| API base URL              | `EXPO_PUBLIC_API_URL` → `src/config/env.ts`               |
| WS base                   | Derived (`ws` / `wss`); Android emulator localhost remap  |
| Session defaults          | AsyncStorage + Query cache (`src/queries/settings.ts`)    |
| REST server state         | `src/queries/*` + `QueryClientProvider` in `_layout`      |
| Android package / plugins | `app.json` + call-capture config plugin                   |

Scripts:

| Script                                | Use                                |
| ------------------------------------- | ---------------------------------- |
| `npm start`                           | Metro / Expo                       |
| `npm run android`                     | Expo start Android (+ adb reverse) |
| `npm run android:prebuild`            | Generate `android/` with plugins   |
| `npm run android:run`                 | Native run (dev client)            |
| `npm run android:apk`                 | `assembleDebug`                    |
| `npm run typecheck` / `lint` / `test` | Quality gates                      |

## Testing layout

| Layer               | Where                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| JS unit / component | `src/**/__tests__`, Jest + jest-expo                                  |
| Query keys / pages  | `src/queries/__tests__`                                               |
| Live domain / WS    | `features/live/domain`, `features/live/session`, `src/api/ws/__tests__` |
| Native PCM helpers  | `modules/filterpass-call-capture/android/src/test` (JUnit)            |

## Extension points

- New REST resources → `src/api/*` + Zod in `src/api/schemas.ts` + `src/types/api.ts` (`z.infer`) + `src/queries/*` options/keys + update `docs/api.md` when backend changes.
- New Live UI phases → `src/features/live/screens/*` driven by `useLiveSession` phase.
- Deeper call capture (background, OEM-specific sources) → Kotlin under `modules/filterpass-call-capture` only; keep JS event contract stable (`onPcm` / `onStatus`).
