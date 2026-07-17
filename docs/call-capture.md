# Call Scan (Android showcase)

FilterPass Call Scan mixes **mic** and **call-path** audio into one PCM16 LE mono stream and sends it over the existing `/ws/frames` WebSocket. The backend decides usefulness; the client streams best-effort frames.

Cross-links: [architecture](./architecture.md) · [tech stack](./tech-stack.md) · [API](./api.md)

## Scope

- Android 10+ sideloaded APK / Expo **dev client** (not Expo Go)
- Foreground only (no background service yet)
- Not intended for Google Play distribution
- iOS / web: Call Scan unavailable (module stubs / throws)

## User flow

1. Install debug APK or `npm run android:run`.
2. System Settings → Accessibility → enable **FilterPass Call Capture**.
3. App → Live Monitor → **Call Scan**.
4. Grant microphone permission if prompted.
5. Prefer starting during an active phone call (OEM-dependent).
6. Tap start → same warmup / score UI as mic mode.
7. End session from the confirm sheet.

## How capture works

1. JS checks Accessibility `{ enabled, connected }` and `RECORD_AUDIO`.
2. Native `DualCaptureEngine` sets `AudioManager.MODE_IN_COMMUNICATION` (best effort).
3. Two `AudioRecord` workers:
   - **mic**: `MIC` → `VOICE_RECOGNITION`
   - **call**: `VOICE_COMMUNICATION` → `VOICE_RECOGNITION` → `CAMCORDER` → `UNPROCESSED` → `MIC`
4. Each worker tries native rates (`requested`, 16 kHz, 48 kHz, 44.1 kHz, 8 kHz), then **linear-resamples** to 16 kHz.
5. Samples are chunked into **100 ms** frames (1,600 samples / **3,200 bytes** PCM16 LE).
6. `PcmFrameAligner` mixes near-timestamp pairs (equal gain) or passes through a single side.
7. Frames emit as `onPcm` `{ data: base64, sampleRate, byteLength }`.
8. `useCallCapture` decodes to `ArrayBuffer`; `useLiveSession` calls `sendPcm` on `/ws/frames`.

OEM behavior varies. Some devices deliver far-end audio on `VOICE_COMMUNICATION`; others mostly capture near-end. Expected for this showcase.

## Module layout

```
modules/filterpass-call-capture/
  index.ts / src/          JS API + web stub
  app.plugin.js            Permissions + AccessibilityService merge (idempotent)
  android/
    …/FilterpassCallCaptureModule.kt
    …/CallCaptureAccessibilityService.kt
    …/audio/PcmAudio.kt           format, codec, resample, chunk, align, mix
    …/audio/AudioRecordWorker.kt
    …/audio/DualCaptureEngine.kt
    src/test/…/PcmAudioTest.kt    JVM unit tests
```

Autolinking: root `package.json` → `"expo.autolinking.nativeModulesDir": "./modules"` and dependency `filterpass-call-capture: file:./modules/filterpass-call-capture`. Plugin registered in `app.json`.

## JS API

| API                           | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `getAccessibilityStatus()`    | `{ enabled, connected }`                                       |
| `openAccessibilitySettings()` | Opens system Accessibility screen                              |
| `start(sampleRate)`           | Starts dual capture (a11y connected + `RECORD_AUDIO`)          |
| `stop()`                      | Stops workers and flushes pending frames                       |
| `onPcm`                       | `{ data: base64, sampleRate, byteLength }`                     |
| `onStatus`                    | `accessibility` / `capture` / `recorder` / `error` diagnostics |

App wiring:

- `src/features/live/hooks/useCallCapture.ts` — listeners + base64 bridge
- `src/features/live/hooks/useLiveSession.ts` — `captureMode: 'mic' | 'call'`
- `src/features/live/screens/LiveIdleView.tsx` — mode toggle + Accessibility card
- `src/lib/base64.ts` — `base64ToArrayBuffer`

## Build

```bash
npm run android:prebuild   # once / after native config changes
npm run android:apk        # assembleDebug APK
# or
npm run android:run        # install + launch on device
```

Native PCM unit tests:

```bash
./android/gradlew -p android :filterpass-call-capture:testDebugUnitTest
```

### Windows / Ninja

Android SDK CMake often ships **Ninja 1.10.2**. Reanimated on Windows needs **Ninja ≥ 1.12**, or builds loop with `ninja: error: manifest 'build.ninja' still dirty after 100 tries`.

Fix: replace `Android/Sdk/cmake/3.22.1/bin/ninja.exe` with [Ninja 1.12.1](https://github.com/ninja-build/ninja/releases/tag/v1.12.1) (keep a `.bak` of the old binary). Prefer a short project path; long OneDrive paths worsen CMake object-path warnings.

## Implementation phases (historical)

| Phase | Intent                                                                     |
| ----- | -------------------------------------------------------------------------- |
| 1     | Local Expo module, config plugin, Accessibility scaffold, sideload scripts |
| 2     | Deterministic PCM resample / frame / align / mix + JUnit tests             |
| 3     | Dual `AudioRecord` workers + status/PCM events                             |
| 4     | `useCallCapture` + Live `captureMode` → existing WS                        |
| 5     | Call Scan UX, docs, APK verification                                       |

## Manual test checklist

1. Install debug APK / run `android:run`.
2. Enable Accessibility service for FilterPass Call Capture.
3. Start a real phone call (or VoIP if the OEM routes it similarly).
4. Open Live → Call Scan → confirm status **Ready** → start.
5. Confirm warmup → scores; frames ack increases.
6. End session; app returns to idle; Accessibility still listed.
7. Regression: Mic mode still works without Accessibility.
