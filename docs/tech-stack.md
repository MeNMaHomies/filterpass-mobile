# Tech stack

FilterPass Mobile is an **Expo SDK 57** React Native client for live spoof detection against a session-scoped backend. This document lists the stack as pinned in the repo (`package.json`, `app.json`, Gradle/Expo config). Prefer these versions over training-data defaults.

## Runtime platforms

| Surface | Stack                                               | Notes                                                                                     |
| ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Android | Expo + native **dev client** / sideloaded debug APK | Package `com.filterpass.mobile`. Call Scan requires a custom native module (not Expo Go). |
| iOS     | Expo (mic path)                                     | Call Scan is Android-only for the showcase.                                               |
| Web     | `expo export --platform web` (static)               | Call capture stubs out; mic path depends on browser APIs.                                 |

Minimum Android target for Call Scan showcase: **Android 10+**. App `minSdk` follows Expo prebuild (currently 24).

## Core application

| Layer      | Choice                                        | Version (approx.) | Role                                |
| ---------- | --------------------------------------------- | ----------------- | ----------------------------------- |
| Framework  | Expo                                          | `~57.0.6`         | Tooling, config plugins, modules    |
| UI runtime | React Native                                  | `0.86.0`          | Native UI                           |
| UI library | React                                         | `19.2.3`          | Components / hooks                  |
| Routing    | Expo Router                                   | `~57.0.6`         | File routes under `src/app/`        |
| Language   | TypeScript                                    | `~6.0.3`          | App + module JS surface             |
| Validation | Zod                                           | `^4.4.3`          | API payload schemas                 |
| Fonts      | Geist / Geist Mono via `@expo-google-fonts/*` | `^0.4.2`          | Embedded through `expo-font` plugin |

Expo docs for this SDK: https://docs.expo.dev/versions/v57.0.0/

## Navigation & layout

| Package                          | Version   | Role                                   |
| -------------------------------- | --------- | -------------------------------------- |
| `expo-router`                    | `~57.0.6` | Tabs + stack (native stack by default) |
| `@react-navigation/bottom-tabs`  | `^7.18.8` | Tab navigator primitives               |
| `react-native-screens`           | `4.25.2`  | Native screen containers               |
| `react-native-safe-area-context` | `~5.7.0`  | Safe areas                             |
| `@gorhom/bottom-sheet`           | `^5.2.14` | Confirm / action sheets                |

## UI, motion, media

| Package                        | Version    | Role                                                     |
| ------------------------------ | ---------- | -------------------------------------------------------- |
| `lucide-react-native`          | `^1.24.0`  | Icons                                                    |
| `react-native-svg`             | `^15.15.5` | Charts / SVG                                             |
| `expo-linear-gradient`         | `^57.0.1`  | Gradients (prefer over Skia blur in Expo Go)             |
| `expo-image`                   | `~57.0.1`  | Images                                                   |
| `expo-haptics`                 | `~57.0.1`  | Haptics                                                  |
| `react-native-reanimated`      | `4.5.0`    | UI-thread animation                                      |
| `react-native-gesture-handler` | `~2.32.0`  | Gestures                                                 |
| `react-native-worklets`        | `0.10.0`   | Worklets runtime (Reanimated peer)                       |
| `@shopify/flash-list`          | `2.0.2`    | Virtualized lists                                        |
| `@expo/ui`                     | `~57.0.6`  | Expo UI kit (available; prefer project `src/components`) |

Theme tokens live in `src/theme/tokens.ts` and `src/theme/typography.ts` (not a third-party design system).

## Audio & live detection

| Package / module          | Version                                            | Role                                                               |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `expo-audio`              | `~57.0.2`                                          | Mic-only live capture (`useAudioStream`, PCM16)                    |
| `filterpass-call-capture` | `file:./modules/filterpass-call-capture` (`0.1.0`) | Android dual `AudioRecord` + Accessibility gate + mix → PCM events |
| `expo-dev-client`         | `~57.0.6`                                          | Required to run the local native module                            |

**Wire format to backend:** PCM16 little-endian mono at session `sample_rate` (default **16 kHz**), binary WebSocket frames on `/ws/frames/{session_id}`. See [`api.md`](./api.md) and [`call-capture.md`](./call-capture.md).

Call Scan native pipeline (Kotlin): resample → 100 ms frames → align → equal-gain mix → base64 `onPcm` → JS `ArrayBuffer` → same WS path as mic.

## Networking & storage

| Package                                     | Version           | Role                                              |
| ------------------------------------------- | ----------------- | ------------------------------------------------- |
| Fetch / WebSocket                           | platform builtins | REST via `src/api/client.ts`; WS in `src/api/ws/` |
| `@react-native-async-storage/async-storage` | `2.2.0`           | Session defaults persistence                      |
| `@react-native-community/netinfo`           | `12.0.1`          | Connectivity + Query `onlineManager`              |
| `@react-native-community/slider`            | `^5.2.0`          | Settings sliders                                  |
| `@tanstack/react-query`                     | `^5.101.2`        | REST server-state cache (`src/queries/`)          |

**Server state:** TanStack Query v5 for REST (complete). WebSockets / live capture stay outside Query. Details: [`react-query-migration.md`](./react-query-migration.md).

Config: `EXPO_PUBLIC_API_URL` (see `.env.example`). Derived WS base in `src/config/env.ts` (`http`→`ws`, emulator `localhost`→`10.0.2.2`).

## Native Android (Call Scan)

| Piece         | Detail                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Language      | Kotlin                                                                                          |
| Capture API   | `AudioRecord` + `MediaRecorder.AudioSource` cascade                                             |
| Service       | `AccessibilityService` (`CallCaptureAccessibilityService`)                                      |
| Config plugin | `modules/filterpass-call-capture/app.plugin.js`                                                 |
| Permissions   | `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `BIND_ACCESSIBILITY_SERVICE`                           |
| Unit tests    | JUnit 4 (`testImplementation 'junit:junit:4.13.2'`)                                             |
| Build         | Gradle via Expo prebuild (`android/`); scripts `android:prebuild`, `android:run`, `android:apk` |

Windows builds: Android SDK CMake may ship **Ninja 1.10.2**; Reanimated needs **Ninja ≥ 1.12** (see Call Scan doc).

## Tooling & quality

| Tool            | Version / entry                                  | Role                    |
| --------------- | ------------------------------------------------ | ----------------------- |
| ESLint          | `eslint-config-expo` `~57.0.0`                   | `npm run lint`          |
| Prettier        | `^3.9.5`                                         | `npm run format`        |
| Jest            | `~29.7.0` + `jest-expo` `~57.0.2`                | `npm test`              |
| Testing Library | `@testing-library/react-native` `^14.0.1`        | Component tests         |
| Typecheck       | `tsc --noEmit`                                   | `npm run typecheck`     |
| Babel           | Expo + `react-native-reanimated/plugin` **last** | Required for Reanimated |

## App experiments (`app.json`)

- `typedRoutes`: true
- `reactCompiler`: true

## Directory map (code)

```
src/
  app/           Expo Router routes (tabs: home, live, history, settings)
  api/           REST + WebSocket clients
  components/    Shared UI (ui/, layout/, charts/)
  features/      Feature screens/hooks (live, home, history, settings, health)
  config/        Env / API base URLs
  theme/         Design tokens
  types/         Domain + API wire types
  lib/           Pure helpers (errors, labels, base64, …)
modules/
  filterpass-call-capture/   Local Expo native module (Android)
docs/
  api.md, architecture.md, tech-stack.md, call-capture.md
```

## What we deliberately avoid

- Shipping Call Scan through **Expo Go** (needs custom native code / dev client).
- Google Play distribution for Call Scan (Accessibility + call-path capture is showcase / sideload).
- Guessing API fields — [`api.md`](./api.md) is authoritative.
- Skia layer blur in Expo Go (known crash); use `expo-linear-gradient` or a dev build.

## Related docs

- Architecture & data flow: [`architecture.md`](./architecture.md)
- Call Scan deep dive: [`call-capture.md`](./call-capture.md)
- Backend contract: [`api.md`](./api.md)
