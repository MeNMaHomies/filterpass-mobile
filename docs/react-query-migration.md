# Server state (TanStack Query)

**Status: complete** (phases 0–7). REST server/cacheable state uses **TanStack Query v5** (`@tanstack/react-query`). Live WebSockets, PCM capture, and the session reducer stay outside Query.

## Layout

```
src/app/_layout.tsx
  QueryClientProvider
    focusManager (AppState) + onlineManager (NetInfo)
    BackendHealthProvider   // façade over useQuery(['health'])
    …

src/api/                 // pure fetchers (queryFns call these)
src/queries/
  client.ts              // QueryClient defaults
  keys.ts                // query key factory
  native.ts              // RN focus / online wiring
  health.ts
  history.ts             // infinite list
  historySession.ts      // session + inferences
  home.ts                // shared overview query options
  settings.ts            // AsyncStorage defaults via Query
  sessions.ts            // create/delete + invalidation
  test-utils.tsx
src/features/*/hooks/    // thin adapters; screens keep stable APIs
```

## Query keys

```ts
// src/queries/keys.ts
export const queryKeys = {
  health: ['health'] as const,
  history: {
    all: ['history'] as const,
    sessions: (params?) => [...queryKeys.history.all, 'sessions', params ?? {}],
    session: (id) => [...queryKeys.history.all, 'session', id],
    inferences: (id, params?) => [...queryKeys.history.all, 'inferences', id, params ?? {}],
    buckets: (params) => [...queryKeys.history.all, 'buckets', params],
    events: (params?) => [...queryKeys.history.all, 'events', params ?? {}],
  },
  sessions: {
    live: (id) => ['sessions', 'live', id],
  },
  settings: {
    defaults: ['settings', 'defaults'] as const,
  },
} as const;
```

Invalidate history after live teardown: `invalidateQueries({ queryKey: queryKeys.history.all })`.

## Feature → Query mapping

| Surface | Hook | Query API |
| ------- | ---- | --------- |
| Health | `BackendHealthProvider` / `ensureReady` | `useQuery` + `fetchQuery` (`healthQueryOptions`) |
| History list | `useHistorySessions` | `useInfiniteQuery` (`historySessionsInfiniteOptions`) |
| Session report | `useSessionReport` | `useQueries` (session + inferences) |
| Home overview | `useHomeOverview` | `useQueries` (health, active, buckets, recent) |
| Settings defaults | `useSessionDefaults` / form mutations | `useQuery` + `setQueryData` on save/reset |
| Live REST | `useLiveSession` create/delete | `createLiveSessionMutation` / `deleteLiveSessionMutation` |

## QueryClient defaults

| Option | Value | Rationale |
| ------ | ----- | --------- |
| `staleTime` | 30_000 | Avoid refetch hammer on tab focus |
| `gcTime` | 5 * 60_000 | Keep lists warm while navigating |
| `retry` | once, skip 4xx / client codes | Don't spin on validation errors |
| `refetchOnReconnect` | true | NetInfo → `onlineManager` |
| `refetchOnWindowFocus` | true | AppState → `focusManager` |

## Out of Query (vanilla)

| Area | Reason |
| ---- | ------ |
| `useLiveSession` phase / metrics / reducer | High-frequency local UI |
| `useMicCapture` / `useCallCapture` | Native push streams |
| `connectLiveSession` / managed sockets | Connection lifecycle |
| Chart throttle (`CHART_FLUSH_MS`) | Render perf |
| Settings form draft fields | Local until save mutation |

## Completed phases

| Phase | Commit theme |
| ----- | ------------ |
| 0 | Scaffold: package, client, keys, RN wiring, provider |
| 1 | Health → Query façade |
| 2 | History infinite query |
| 3 | Session report `useQueries` |
| 4 | Home shared keys |
| 5 | Settings defaults Query cache |
| 6 | Live REST mutations + invalidation |
| 7 | Remove `useAsyncResource`; docs cleanup |

## Follow-ups (optional)

- Prefetch session detail on History row press
- `@tanstack/react-query-persist-client` for warm start
- Delete remaining settings store façade once all callers use `@/queries/settings`
- Devtools on web only

## References

- TanStack Query React Native: focusManager + onlineManager
- API modules: `src/api/{health,history,sessions}.ts`
- Architecture overview: [`architecture.md`](./architecture.md)
