# Call Scan (Android showcase)

FilterPass Call Scan mixes **mic** and **call-path** audio into one PCM16 LE mono stream and sends it over the existing `/ws/frames` WebSocket. The backend decides usefulness; the client streams best-effort frames.

## Scope

- Android 10+ sideloaded APK / Expo dev client
- Foreground only (no background service yet)
- Not intended for Google Play distribution

## How capture works

1. User enables **FilterPass Call Capture** under system Accessibility.
2. Live Monitor → **Call Scan** → grant mic permission → start session.
3. Native module opens two `AudioRecord` workers:
   - **mic**: `MIC` / `VOICE_RECOGNITION`
   - **call**: `VOICE_COMMUNICATION` → fallbacks (`VOICE_RECOGNITION`, `CAMCORDER`, `UNPROCESSED`, `MIC`)
4. Each worker resamples to **16 kHz**, chunks **100 ms** frames (3,200 bytes PCM16 LE).
5. Frames are time-aligned and equal-gain mixed (or pass through if one side is missing).
6. Mixed frames are emitted as base64 `onPcm` events and forwarded as binary WS frames.

OEM behavior varies. Some devices deliver far-end audio on `VOICE_COMMUNICATION`; others mostly capture near-end. That is expected for this showcase.

## Build

```bash
npm run android:prebuild   # once / after native config changes
npm run android:apk        # assembleDebug APK
# or
npm run android:run        # install + launch on device
```

Windows note: Android SDK CMake ships Ninja **1.10.2**. Reanimated needs **Ninja ≥ 1.12**. Replace `Android/Sdk/cmake/3.22.1/bin/ninja.exe` with [Ninja 1.12.1](https://github.com/ninja-build/ninja/releases/tag/v1.12.1) if `build.ninja still dirty` appears.

## Native module

Local Expo module: `modules/filterpass-call-capture`

| JS API | Purpose |
|--------|---------|
| `getAccessibilityStatus()` | `{ enabled, connected }` |
| `openAccessibilitySettings()` | Opens system Accessibility screen |
| `start(sampleRate)` | Starts dual capture (requires a11y connected + `RECORD_AUDIO`) |
| `stop()` | Stops workers and flushes pending frames |
| `onPcm` | `{ data: base64, sampleRate, byteLength }` |
| `onStatus` | accessibility / capture / recorder diagnostics |

## Live app wiring

- `useCallCapture` — JS bridge + base64 → `ArrayBuffer`
- `useLiveSession` — `captureMode: 'mic' | 'call'` swaps expo-audio vs call capture into the same frames socket
- Live idle UI — Mic / Call Scan toggle + Accessibility setup card

## Manual test checklist

1. Install debug APK / run `android:run`.
2. Enable Accessibility service for FilterPass Call Capture.
3. Start a real phone call (or VoIP if your OEM routes it similarly).
4. Open Live → Call Scan → start.
5. Confirm warmup → scores arrive; frames ack increases.
6. End session; confirm Accessibility still listed and app returns to idle.
