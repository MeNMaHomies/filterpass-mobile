export const queryKeys = {
	health: ['health'] as const,
	history: {
		all: ['history'] as const,
		sessions: (params?: {
			limit?: number;
			offset?: number;
			only_closed?: boolean;
		}) => [...queryKeys.history.all, 'sessions', params ?? {}] as const,
		session: (id: string) =>
			[...queryKeys.history.all, 'session', id] as const,
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
