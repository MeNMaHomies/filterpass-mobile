# React Query migration plan

Move server/cacheable async state from hand-rolled hooks (`useAsyncResource`, Context health, pagination `useState`) to **TanStack Query v5** (`@tanstack/react-query`).

Live WebSockets, PCM capture, and session reducer stay outside Query — they are push streams / local orchestration, not request/response cache.

## Why

Current pattern:

| Surface | Today | Pain |
| ------- | ----- | ---- |
| Home overview | `useAsyncResource` + 4 parallel fetches in one blob | No cache, no dedupe, refetch = full remount of work |
| History list | Custom offset pagination in `useHistorySessions` | Duplicates loading flags; no shared cache with Home recent |
| Session report | `useAsyncResource` + defaults side-load | Report ↔ History list never share session row |
| Backend health | `BackendHealthProvider` Context | Second cache of `/health`; Live `ensureReady` bypasses Query |
| Session defaults | Module singleton + subscribers | Works, but not Query; fine as **client** store or Query `queryFn` over AsyncStorage |
| Live session | `useLiveSession` mutations + WS | Correct domain; only REST create/delete should be Query mutations |

Vanilla loading/error/refresh does not scale when:

- Home and History both need sessions
- Live stop should invalidate history/home
- Focus / reconnect should refetch without bespoke `useEffect`s
- Pagination, stale-while-revalidate, and request cancellation become per-hook reinventions

## Non-goals (phase 0–3)

- Do **not** put `/ws/frames` or `/ws/output` in Query.
- Do **not** replace `useLiveSession` phase/metrics with Query.
- Do **not** add Redux/Zustand for server state (Query is the server cache).
- Optional later: PersistQueryClient + AsyncStorage for offline warm start — **not** required for first cut.

## Target package

| Package | Role |
| ------- | ---- |
| `@tanstack/react-query` | Queries + mutations (v5) |
| Existing `@react-native-community/netinfo` | `onlineManager` (already in app) |

Dev-only later: `@tanstack/react-query-devtools` (web) if useful.

## Architecture after migration

```
src/app/_layout.tsx
  QueryClientProvider
    focusManager (AppState) + onlineManager (NetInfo)  // once at root
    BackendHealthProvider  // thin wrapper over useQuery(['health']) OR delete Context
    …

src/api/                 // keep pure fetchers (queryFns call these)
src/queries/
  keys.ts                // query key factory
  health.ts
  history.ts
  sessions.ts            // create/delete mutations
  home.ts                // composed overview or parallel useQueries
src/features/*/hooks/    // thin adapters → screens unchanged where possible
```

Screens keep calling feature hooks (`useHomeOverview`, `useHistorySessions`, …). Internals swap to Query; public hook shapes stay stable until a deliberate API cleanup.

## Query key factory (canonical)

```ts
// src/queries/keys.ts
export const queryKeys = {
  health: ['health'] as const,
  history: {
    all: ['history'] as const,
    sessions: (params?: { limit?: number; offset?: number; only_closed?: boolean }) =>
      [...queryKeys.history.all, 'sessions', params ?? {}] as const,
    session: (id: string) => [...queryKeys.history.all, 'session', id] as const,
    inferences: (id: string, params?: object) =>
      [...queryKeys.history.all, 'inferences', id, params ?? {}] as const,
    buckets: (params: object) =>
      [...queryKeys.history.all, 'buckets', params] as const,
    events: (params?: object) =>
      [...queryKeys.history.all, 'events', params ?? {}] as const,
  },
  sessions: {
    live: (id: string) => ['sessions', 'live', id] as const,
  },
  settings: {
    defaults: ['settings', 'defaults'] as const,
  },
} as const;
```

Invalidate by prefix: `queryClient.invalidateQueries({ queryKey: queryKeys.history.all })` after live stop / history delete.

## Default QueryClient policy

Suggested defaults for this app (mobile + local backend):

| Option | Value | Rationale |
| ------ | ----- | --------- |
| `staleTime` | 30_000 | Avoid hammering `/health` + history on every tab focus |
| `gcTime` | 5 * 60_000 | Keep recent lists warm while navigating tabs |
| `retry` | 1 (or `(n, err) => …`) | Don't spin on 4xx; retry once on network |
| `refetchOnReconnect` | true | NetInfo → onlineManager |
| `refetchOnWindowFocus` | true | AppState → focusManager (RN) |

Map `ApiError` in `throwOnError` / UI via existing `formatApiError`.

## React Native wiring (install once)

In root (or `src/queries/native.ts` imported from `_layout`):

1. `onlineManager.setEventListener` → NetInfo (already used by `apiRequest`).
2. `focusManager.setFocused` → `AppState` `'active'`.
3. Wrap tree with `QueryClientProvider`.

Place provider **outside** feature screens, **inside** `GestureHandlerRootView` / `SafeAreaProvider` (same level as today's `BackendHealthProvider`).

## Migration phases

### Phase 0 — Scaffold (no behavior change) ✅

1. Add `@tanstack/react-query`.
2. Create `src/queries/client.ts` (QueryClient singleton) + `src/queries/keys.ts`.
3. Wire provider + focus/online in `_layout.tsx`.
4. Document in `docs/tech-stack.md` + this file.
5. Add Jest helper: wrap with `QueryClientProvider` + fresh client (`queries/test-utils.tsx`).

**Exit:** app boots; no hooks migrated yet.

### Phase 1 — Health (replace Context cache) ✅

| Move | From | To |
| ---- | ---- | -- |
| `/health` poll | `BackendHealthProvider` | `useQuery({ queryKey: queryKeys.health, queryFn: getHealth })` |
| `ensureReady` | Context method | `queryClient.fetchQuery` + `assertBackendHealthy` |

**A (done):** Keep `BackendHealthProvider` as a thin façade over Query so screens don't churn.

**Exit:** single `/health` cache; Live start uses `fetchQuery`; offline still clears error to offlineBanner.

### Phase 2 — History list (infinite query)

Replace `useHistorySessions` offset state with `useInfiniteQuery`:

```ts
useInfiniteQuery({
  queryKey: queryKeys.history.sessions({ limit: 50 }),
  queryFn: ({ pageParam }) =>
    listHistorySessions({ limit: 50, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage, _pages, lastOffset) =>
    lastPage.length < 50 ? undefined : lastOffset + lastPage.length,
})
```

- Map pages → `HistorySession[]` in the feature hook (keep `real_threshold` via settings query or `ensureSessionDefaults`).
- `refresh` → `refetch`; `loadMore` → `fetchNextPage`.
- Home “recent sessions” should **read the same key family** or a sibling key invalidated together — avoid two independent list caches drifting.

**Exit:** History pagination via Query; pull-to-refresh works; `useAsyncResource` unused here.

### Phase 3 — Session report

Split today's combined load:

| Query | Key | Fn |
| ----- | --- | -- |
| Session summary | `queryKeys.history.session(id)` | `getHistorySession` |
| Inferences | `queryKeys.history.inferences(id, { limit: 1000 })` | `getSessionInferences` |

Compose in `useSessionReport` with `useQueries` or two `useQuery`s. Derive timeline/label in render (pure), still using settings `real_threshold`.

Prefetch opportunity: History row press → `queryClient.prefetchQuery(session)`.

**Exit:** Report shares session entity cache with any future consumers; validation `enabled: !!parseSessionId(id)`.

### Phase 4 — Home overview

Stop one mega-fetch blob. Prefer:

```ts
useQueries({
  queries: [
    { queryKey: queryKeys.health, queryFn: getHealth },
    { queryKey: queryKeys.history.sessions({ only_closed: false, limit: 100 }), … },
    { queryKey: queryKeys.history.buckets({ from_ts, to_ts, bucket_s: 3600 }), … },
    { queryKey: queryKeys.history.sessions({ limit: 3 }), … },
  ],
})
```

Or keep `useHomeOverview` but implement with `Promise.all` inside **one** `queryFn` keyed `['home','overview', dayBucket]` — simpler UI, worse sharing. Prefer parallel queries for cache reuse with History/Health.

**Exit:** Home KPIs use shared health + history keys; tab switches feel instant when warm.

### Phase 5 — Settings defaults

Two valid paths:

1. **Keep** `sessionDefaultsStore` as client persistence (not server). Expose via `useSessionDefaults` as today.
2. **Or** `useQuery({ queryKey: queryKeys.settings.defaults, queryFn: loadSessionDefaults })` + `useMutation` for save/reset that `setQueryData` / invalidate.

Prefer (2) only if multiple screens need suspense/isLoading parity; otherwise leave store and teach Query consumers to call `ensureSessionDefaults` inside `queryFn` where labels need `real_threshold`.

**Exit:** one write path for defaults; Live/Settings/Home see updates without custom pub/sub if using Query.

### Phase 6 — Live REST mutations

| Action | Mutation | On success |
| ------ | -------- | ---------- |
| `createSession` | `useMutation` | optional; session id still local to Live |
| `deleteSession` (teardown / unmount) | `useMutation` or `queryClient` call | `invalidateQueries(queryKeys.history.all)` + home overview keys |

Do **not** put WS connect in `mutationFn`. Keep `connectLiveSession` imperative.

**Exit:** stopping a live session refreshes History/Home without manual refresh taps.

### Phase 7 — Cleanup

1. Delete `useAsyncResource` once unused (or keep as tiny wrapper around `useQuery` — prefer delete).
2. Shrink/remove duplicate loading flags in feature hooks.
3. Update `docs/architecture.md` data layer section.
4. Add tests: query key stability, infinite page param, mutation invalidation.
5. Optional: PersistQueryClient for settings + last history page.

## What stays vanilla

| Area | Reason |
| ---- | ------ |
| `useLiveSession` phase/metrics/reducer | High-frequency local UI state |
| `useMicCapture` / `useCallCapture` | Native streams |
| `connectLiveSession` / managed sockets | Connection lifecycle ≠ HTTP cache |
| Chart throttling (`CHART_FLUSH_MS`) | Render perf, not server state |
| UI form draft state in Settings | Local until save mutation |

## Testing plan

| Layer | Approach |
| ----- | -------- |
| QueryFns | Existing API module tests unchanged |
| Hooks | `renderHook` + fresh `QueryClient` (`retry: false`) |
| Invalidation | Assert `queryClient.getQueryState` after mutation |
| RN focus/online | Unit-test wiring modules with mocked AppState/NetInfo |

Avoid MSW unless already planned; keep using real `apiRequest` mocks / fetch mocks as today.

## Rollout order (summary)

```
0 Scaffold → 1 Health → 2 History infinite → 3 Report → 4 Home → 5 Settings (optional Query) → 6 Live mutations → 7 Cleanup
```

Each phase: one PR, typecheck + tests green, screens visually unchanged.

## Success criteria

- No feature screen owns raw `useState` loading/error for REST (except local UI).
- `/health` and history session entities have **one** cache identity.
- App foreground + reconnect refetch without custom timers.
- Live stop invalidates history/home.
- WS/capture code paths untouched by Query imports.

## Open decisions (resolve in Phase 0)

1. Health Context façade vs delete Context.
2. Home: parallel `useQueries` vs single overview key.
3. Settings: keep module store vs Query over AsyncStorage.
4. Whether to introduce `@tanstack/react-query-persist-client` in Phase 7 or never.

## References

- TanStack Query React Native: focusManager + onlineManager
- Existing API modules: `src/api/{health,history,sessions}.ts`
- Current async helpers: `src/hooks/useAsyncResource.ts`, `src/features/health/BackendHealthProvider.tsx`, `src/features/history/hooks/useHistorySessions.ts`
