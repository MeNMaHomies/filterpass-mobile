# API Reference

OpenAPI is auto-served at `/docs` (Swagger) and `/redoc`. Authoritative
shapes live in `app/features/sessions/schemas.py`. Defaults come from
`app/core/config.py`.

## Overview

Session-scoped audio spoof inference. Clients `POST /sessions` to create
a session and receive a `session_id` plus the resolved config. Audio
streams over two parallel WebSocket channels: `/ws/frames/{session_id}`
(client pushes PCM16 binary frames in) and `/ws/output/{session_id}`
(server pushes score/warmup/error JSON out). Each WS channel allows at
most one attached client.

## REST

### `GET /health`

Liveness + model-load check.

```json
{ "status": "ok", "device": "cuda", "model_loaded": true }
```

### `POST /sessions`

Create a session. All body fields optional; omitted values fall back to
`app.core.config` defaults.

| Field              | Default                         | Notes                                                                                                                                                |
| ------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sample_rate`      | `TARGET_SR` (16000)             | Hz. Sizes `chunk_samples = round(sample_rate * chunk_duration_s)`.                                                                                   |
| `chunk_duration_s` | `CHUNK_DURATION_S` (0.5)        | Seconds per inference chunk.                                                                                                                         |
| `chunk_overlap_s`  | `CHUNK_OVERLAP_S` (0.0)         | Seconds of overlap between consecutive chunks. Must be `< chunk_duration_s`. `0` = sequential. Effective hop = `chunk_duration_s - chunk_overlap_s`. |
| `ema_alpha`        | `EMA_ALPHA` (0.3)               | Session-score EMA smoothing. Higher = more reactive.                                                                                                 |
| `spoof_threshold`  | `SPOOF_THRESHOLD` (0.5)         | `session_score >= threshold` -> `"spoof"`.                                                                                                           |
| `vad_mode`         | `VAD_MODE` (2)                  | WebRTC VAD aggressiveness, 0-3.                                                                                                                      |
| `vad_frame_ms`     | `VAD_FRAME_MS` (30)             | VAD frame size in ms, one of {10, 20, 30}.                                                                                                           |
| `idle_timeout_s`   | `SESSION_IDLE_TIMEOUT_S` (60.0) | Evict if no inbound frame for this long.                                                                                                             |

Server-only knobs (fixed by `app/core/config.py`, not overridable per session):
`max_frame_bytes` (`MAX_FRAME_BYTES`, 262144) - per inbound binary frame cap;
`output_queue_max` (`OUTPUT_QUEUE_MAX`, 256) - backpressure cap for `/ws/output` queue.

Request:

```json
{ "sample_rate": 16000, "chunk_duration_s": 0.5, "spoof_threshold": 0.6 }
```

Response (201):

```json
{
	"session_id": "a3f1...",
	"config": {
		"sample_rate": 16000,
		"chunk_samples": 8000,
		"chunk_duration_s": 0.5,
		"chunk_overlap_s": 0.0,
		"chunk_overlap_samples": 0,
		"ema_alpha": 0.3,
		"spoof_threshold": 0.6,
		"vad_mode": 2,
		"vad_frame_ms": 30,
		"idle_timeout_s": 60.0
	}
}
```

429 `session_limit_reached` if `MAX_SESSIONS` (64) reached.

### `GET /sessions/{session_id}`

```json
{
	"session_id": "a3f1...",
	"status": "active",
	"created_at": 1715479200.12,
	"last_frame_at": 1715479205.44,
	"frames_seen": 142,
	"chunks_inferred": 10,
	"last_chunk_prob": 0.7421,
	"last_session_score": 0.6803,
	"config": {
		"sample_rate": 16000,
		"chunk_samples": 8000,
		"chunk_duration_s": 0.5,
		"chunk_overlap_s": 0.0,
		"chunk_overlap_samples": 0,
		"ema_alpha": 0.3,
		"spoof_threshold": 0.6,
		"vad_mode": 2,
		"vad_frame_ms": 30,
		"idle_timeout_s": 60.0
	}
}
```

404 `session_not_found` if unknown id.

### `DELETE /sessions/{session_id}`

204 on success. 404 if unknown. Closes any attached WS channels, resets
buffer + aggregator, drops the record.

## WebSockets

Both channels use `session_id` from `POST /sessions`. At most one
client per channel per session.

Common close codes:

| Code | Meaning          |
| ---- | ---------------- |
| 4404 | unknown session  |
| 4409 | already attached |
| 1011 | server error     |

### `WS /ws/frames/{session_id}` (inbound)

Client sends. Server emits per-frame `ack` + soft `error` replies.

**Binary frames:** raw PCM16 little-endian bytes at the negotiated
`sample_rate`. Server replies for every binary frame with the frame index
plus the VAD verdict for that frame so the client can compute voice-activity
stats:

```json
{ "type": "ack", "frame_idx": 142, "voiced": true, "voiced_samples": 320 }
```

- `voiced` - `true` iff WebRTC VAD flagged at least one frame as speech.
- `voiced_samples` - count of speech samples kept after VAD. `0` when
  silence-only (no inference runs for that frame).

If `len(frame) > MAX_FRAME_BYTES` (server config):

```json
{ "type": "error", "code": "frame_too_large" }
```

**Text control messages:** JSON.

Reset aggregator + buffer:

```json
{ "type": "reset" }
```

Update sample rate (recomputes `chunk_samples` + `chunk_overlap_samples`, resets buffer + aggregator):

```json
{ "type": "set_sample_rate", "sample_rate": 22050 }
```

Soft errors (socket stays open):

| `code`                | When                                                        |
| --------------------- | ----------------------------------------------------------- |
| `frame_too_large`     | binary frame exceeds server-configured `MAX_FRAME_BYTES`    |
| `decode_failed`       | VAD/decode raised on a chunk                                |
| `invalid_sample_rate` | `set_sample_rate` value missing or out of range (0, 192000] |
| `invalid_control`     | bad JSON, non-object, or unknown `type`                     |

### `WS /ws/output/{session_id}` (outbound, server-only)

Server pushes JSON messages tagged by `type`. The client should not
send on this channel.

**`score`** - per completed inference chunk:

```json
{
	"type": "score",
	"session_id": "a3f1...",
	"chunk_idx": 10,
	"chunk_prob": 0.7421,
	"session_score": 0.6803,
	"latency_ms": 82.13,
	"rtf": 0.082134
}
```

`latency_ms` is the wall-clock model inference time for that chunk.
`rtf = latency_ms / 1000 / chunk_duration_s` (real-time factor). The
spoof/real label is **not** sent by the backend - clients derive it from
`session_score >= spoof_threshold`. `spoof_threshold` is returned in the
session config from `POST /sessions` / `GET /sessions/{id}`.

**`warmup`** - voiced buffer not yet full, no inference run:

```json
{
	"type": "warmup",
	"session_id": "a3f1...",
	"buffer_fill_samples": 3200,
	"buffer_target_samples": 8000
}
```

**`error`** - inference path failures:

```json
{
	"type": "error",
	"session_id": "a3f1...",
	"code": "decode_failed",
	"message": ""
}
```

`code` is one of `decode_failed`, `infer_failed`.

## Score labels

Backend does not emit a label. Clients derive it locally from each
`score` event:

| Condition                          | label     |
| ---------------------------------- | --------- |
| `session_score >= spoof_threshold` | `"spoof"` |
| else                               | `"real"`  |

`spoof_threshold` is per-session, set on `POST /sessions`. Default
`SPOOF_THRESHOLD = 0.5`. Returned in the session config so clients can
read it once at session start and apply consistently.

## Request correlation

Every REST response carries an `X-Request-Id` header. If the request
includes `X-Request-Id`, it is echoed; otherwise the server generates
one. Logs are correlated by this id.

## Session lifecycle / idle eviction

Sessions transition `CREATED -> ACTIVE` when `/ws/frames` attaches.
A background sweeper runs every `SESSION_SWEEP_INTERVAL_S` (10.0s) and
evicts any session whose `last_frame_at` is older than its
`idle_timeout_s` (default 60.0s). Eviction closes both WS channels,
resets buffer + aggregator, and removes the record from the store.
`DELETE /sessions/{session_id}` performs the same teardown on demand.

## History (SQLite persistence)

Every session lifecycle event and every emitted inference is mirrored
to a SQLite file (`HISTORY_DB_PATH`, default `data/filterpass_history.db`)
when `HISTORY_ENABLED=true` (default). Sessions remain queryable after
they're closed and across backend restarts. Orphan sessions (those left
open by a crashed process) are auto-closed at startup using the last
recorded inference timestamp.

`/sessions` is the **live** registry (RAM). `/history/sessions` is the
**durable** registry (disk). Live sessions appear in both; closed
sessions only in history.

Writes are batched off the hot path by a single async writer task
(default flush every `HISTORY_FLUSH_INTERVAL_S = 1.0s` or every
`HISTORY_FLUSH_BATCH = 200` rows, whichever first). SQLite runs in WAL
mode with `synchronous=NORMAL`. The inference WebSocket path never
awaits the disk.

### `GET /history/sessions`

List durable sessions, newest first.

| Query         | Default | Notes                                                    |
| ------------- | ------- | -------------------------------------------------------- |
| `limit`       | 50      | 1..100                                                   |
| `offset`      | 0       | pagination                                               |
| `only_closed` | (unset) | `true` = closed only, `false` = live only, omit for both |

```json
[
	{
		"session_id": "a3f1...",
		"created_at": 1715479200.12,
		"closed_at": 1715479830.45,
		"sample_rate": 16000,
		"chunk_duration_s": 0.5,
		"ema_alpha": 0.3,
		"spoof_threshold": 0.5,
		"device": "cuda",
		"frames_seen": 1432,
		"chunks_inferred": 47,
		"last_rtf": 0.0821,
		"avg_session_score": 0.6412,
		"avg_latency_ms": 41.07,
		"voiced_frames": 1102,
		"voice_activity": 0.7695
	}
]
```

`last_rtf` is the real-time factor of the most recent inference chunk
(elapsed inference seconds / `chunk_duration_s`). `null` until at least
one inference has run. Persisted on every successful inference and on
session close.

`avg_session_score` is the running mean of `session_score` across
recorded inferences for the session, derived from the cached
`sum_session_score` column. `null` if zero inferences ran. Use this for
at-a-glance session "spoofiness" without paginating through
`/inferences`.

`voiced_frames` is the count of inbound `/ws/frames` whose audio passed
WebRTC VAD. `voice_activity = voiced_frames / frames_seen` is the share
of frames that contained speech; both are `null` on sessions created
before schema v4.

`avg_latency_ms` is the mean per-chunk inference wall time across
recorded inferences for the session (`sum_latency_ms / chunks_inferred`).
`null` if zero inferences ran or on sessions created before schema v5.

### `GET /history/sessions/{session_id}`

Single session summary. 404 if not in history. Same shape as the list
entry above (includes `last_rtf`).

### `GET /history/sessions/{session_id}/inferences`

Per-chunk timeseries for dashboard charts.

| Query         | Default | Notes                                       |
| ------------- | ------- | ------------------------------------------- |
| `since_chunk` | 0       | filter `chunk_idx >= since_chunk`           |
| `limit`       | 1000    | 1..10000                                    |
| `from_ts`     | (unset) | unix epoch seconds (lower bound, inclusive) |
| `to_ts`       | (unset) | unix epoch seconds (upper bound, inclusive) |

```json
{
	"session_id": "a3f1...",
	"count": 47,
	"entries": [
		{
			"session_id": "a3f1...",
			"chunk_idx": 1,
			"ts": 1715479201.04,
			"chunk_prob": 0.7421,
			"session_score": 0.5734,
			"rtf": 0.0821
		}
	]
}
```

### `GET /history/sessions/{session_id}/events`

Lifecycle / control / error markers, oldest first.

```json
{
	"session_id": "a3f1...",
	"count": 2,
	"entries": [
		{
			"id": 1,
			"session_id": "a3f1...",
			"ts": 1715479200.12,
			"event_type": "created",
			"details": { "sample_rate": 16000 }
		},
		{
			"id": 2,
			"session_id": "a3f1...",
			"ts": 1715479260.0,
			"event_type": "set_sample_rate",
			"details": { "sample_rate": 22050 }
		}
	]
}
```

`event_type` is one of: `created`, `closed`, `reset`, `set_sample_rate`,
`idle_evicted`, `decode_failed`, `infer_failed`.

### `DELETE /history/sessions/{session_id}`

Purge a session and its inferences + events from the history DB
(`ON DELETE CASCADE`). 204 on success, 404 if unknown. Independent of
the live `DELETE /sessions/{id}` - that only frees RAM.

### `GET /history/inferences/buckets`

Time-bucketed totals of recorded inferences across **all** sessions.
Intended source for dashboard charts (Overview "Inference volume" bar).
Prefer this over fanning out per-session via
`/history/sessions/{id}/inferences`.

| Query      | Default      | Notes                                    |
| ---------- | ------------ | ---------------------------------------- |
| `from_ts`  | `now - 1800` | inclusive lower bound on `inferences.ts` |
| `to_ts`    | `now`        | exclusive upper bound                    |
| `bucket_s` | `60`         | bucket width in seconds, must be `> 0`   |

Validation (422 on failure):

- `from_ts < to_ts` and both finite
- `bucket_s > 0`
- `ceil((to_ts - from_ts) / bucket_s) <= 2000` (cap protects against
  degenerate inputs; pick a larger `bucket_s` for wider windows)

Response shape:

```json
{
	"from_ts": 1715479200.0,
	"to_ts": 1715481000.0,
	"bucket_s": 60.0,
	"buckets": [
		{ "t_start": 1715479200.0, "chunks_total": 142, "chunks_spoof": 21 },
		{ "t_start": 1715479260.0, "chunks_total": 138, "chunks_spoof": 18 }
	]
}
```

- One entry per **non-empty** bucket. Empty buckets are omitted; the
  client pads gaps. Keeps responses small.
- `t_start = from_ts + bucket_idx * bucket_s` for the bucket each chunk
  fell into.
- Ascending order by `t_start`.
- `chunks_spoof` reflects chunks the backend persisted with label
  `"spoof"` at the time of inference. Spoof/real status is otherwise
  client-derived from `session_score >= spoof_threshold` per session.

### `GET /history/events`

Global, newest-first lifecycle event feed across all sessions. Drives
the Overview "Recent activity" card.

| Query        | Default | Notes                                                                                                                              |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `limit`      | 50      | 1..500                                                                                                                             |
| `before_ts`  | (unset) | cursor - return events with `ts < before_ts`                                                                                       |
| `event_type` | (unset) | repeatable filter; one or more of `created`, `closed`, `reset`, `set_sample_rate`, `idle_evicted`, `decode_failed`, `infer_failed` |

Response (same `HistoryEvent` shape used by the per-session feed):

```json
{
	"count": 50,
	"entries": [
		{
			"id": 12048,
			"session_id": "a3f1...",
			"ts": 1715480991.04,
			"event_type": "closed",
			"details": null
		}
	]
}
```

Order: `ts DESC, id DESC` (id breaks ties when ts collides).

Retention note: this feed is bounded by `HISTORY_RETENTION_DAYS` -
events for closed sessions older than the cutoff are pruned along with
their parent session (`ON DELETE CASCADE`). Clients paging back through
history should not expect to reach indefinitely.

### Retention

`HISTORY_RETENTION_DAYS` (default `30`) drives a background task that
deletes closed sessions older than the cutoff once every 24 hours.
Set to `0` to keep forever. Sweep also runs once at startup.

### Config knobs (`app/core/config.py`)

| Constant                   | Default                        | Notes                                                          |
| -------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `HISTORY_ENABLED`          | `True`                         | Master switch. When false, the writer + REST routes are inert. |
| `HISTORY_DB_PATH`          | `"data/filterpass_history.db"` | SQLite file path; parent dir auto-created.                     |
| `HISTORY_FLUSH_INTERVAL_S` | `1.0`                          | Writer flush cadence.                                          |
| `HISTORY_FLUSH_BATCH`      | `200`                          | Force flush when queue hits this depth.                        |
| `HISTORY_RETENTION_DAYS`   | `30`                           | `0` = keep forever.                                            |
| `HISTORY_QUEUE_MAX`        | `10000`                        | Writer backpressure cap; drops with warning log when full.     |

### Schema (SQLite)

```sql
CREATE TABLE sessions (
    session_id       TEXT PRIMARY KEY,
    created_at       REAL NOT NULL,
    closed_at        REAL,
    sample_rate      INTEGER NOT NULL,
    chunk_duration_s REAL NOT NULL,
    ema_alpha        REAL NOT NULL,
    spoof_threshold  REAL NOT NULL,
    device           TEXT,
    frames_seen      INTEGER NOT NULL DEFAULT 0,
    chunks_inferred  INTEGER NOT NULL DEFAULT 0,
    last_label        TEXT,           -- v1, no longer exposed via API
    last_rtf          REAL,            -- v2
    sum_session_score REAL NOT NULL DEFAULT 0,  -- v3, drives avg_session_score
    voiced_frames     INTEGER,         -- v4, drives voice_activity
    sum_latency_ms    REAL NOT NULL DEFAULT 0   -- v5, drives avg_latency_ms
);

CREATE TABLE inferences (
    session_id    TEXT NOT NULL,
    chunk_idx     INTEGER NOT NULL,
    ts            REAL NOT NULL,
    chunk_prob    REAL NOT NULL,
    session_score REAL NOT NULL,
    label         TEXT NOT NULL,  -- persisted; not exposed via API
    rtf           REAL NOT NULL,
    PRIMARY KEY (session_id, chunk_idx),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);
CREATE INDEX idx_inferences_ts ON inferences(session_id, ts);

CREATE TABLE events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    ts         REAL NOT NULL,
    event_type TEXT NOT NULL,
    details    TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);
```

Migrations: schema version tracked via `PRAGMA user_version`. The
backend applies pending `CREATE` / `ALTER` statements on startup. No
external migration tool.
