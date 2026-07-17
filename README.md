# FilterPass Mobile

Expo SDK 57 client for **live spoof detection**: stream PCM audio to a session-scoped backend and watch scores in real time.

## Docs

| Doc                                          | Contents                                         |
| -------------------------------------------- | ------------------------------------------------ |
| [docs/README.md](docs/README.md)             | Index                                            |
| [docs/tech-stack.md](docs/tech-stack.md)     | Frameworks, libraries, versions, tooling         |
| [docs/architecture.md](docs/architecture.md) | App structure, live flow, TanStack Query layer   |
| [docs/api.md](docs/api.md)                   | Backend REST + WebSocket contract                |
| [docs/call-capture.md](docs/call-capture.md) | Android Call Scan (Accessibility + dual capture) |
| [docs/react-query-migration.md](docs/react-query-migration.md) | REST server-state (Query) layout   |

Agent guidelines: [CLAUDE.md](CLAUDE.md) (includes [@AGENTS.md](AGENTS.md)).

## Quick start

```bash
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL if needed
npm start
```

### Mic-only (Expo Go / emulator)

```bash
npm run android   # or ios / web
```

### Call Scan (Android native)

Needs a **dev client** or debug APK (local module `filterpass-call-capture`):

```bash
npm run android:prebuild
npm run android:run
# or
npm run android:apk
```

Then enable **FilterPass Call Capture** under system Accessibility. See [docs/call-capture.md](docs/call-capture.md).

## Scripts

| Script                            | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `npm start`                       | Expo / Metro                            |
| `npm run android` / `ios` / `web` | Platform start                          |
| `npm run android:prebuild`        | Generate native `android/` with plugins |
| `npm run android:run`             | Build + install native app              |
| `npm run android:apk`             | `assembleDebug`                         |
| `npm run typecheck`               | `tsc --noEmit`                          |
| `npm run lint`                    | ESLint                                  |
| `npm test`                        | Jest                                    |
| `npm run format`                  | Prettier                                |

## Stack (summary)

- **Expo 57** · React Native 0.86 · React 19 · Expo Router · TypeScript
- Live mic: **expo-audio**
- Call Scan: local Kotlin Expo module + AccessibilityService
- Motion: Reanimated 4 · Gesture Handler
- Validation: Zod · tests: Jest / jest-expo

Full inventory: [docs/tech-stack.md](docs/tech-stack.md).
