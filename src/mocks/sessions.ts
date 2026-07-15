import type {
	ChunkTimelineItem,
	HistorySession,
	RecentSession,
} from '@/types';

export const recentSessions: RecentSession[] = [
	{ id: 'a3f9…c2', score: 0.18, label: 'REAL' },
	{ id: 'b7e1…9a', score: 0.72, label: 'SPOOF' },
	{ id: 'c4d2…1f', score: 0.44, label: 'REAL' },
];

export const historySessions: HistorySession[] = [
	{
		id: 'a3f9c2e1',
		label: 'REAL',
		score: 0.18,
		duration: '4m 12s',
		ago: '2h ago',
	},
	{
		id: 'b7e19a44',
		label: 'SPOOF',
		score: 0.72,
		duration: '1m 08s',
		ago: '5h ago',
	},
	{
		id: 'c4d21f88',
		label: 'REAL',
		score: 0.44,
		duration: '6m 33s',
		ago: '1d ago',
	},
];

export const reportChunks: ChunkTimelineItem[] = [
	{ time: '00:42', score: 0.22, label: 'REAL' },
	{ time: '00:43', score: 0.31, label: 'REAL' },
	{ time: '00:44', score: 0.58, label: 'REAL' },
];

export const liveChunkHistory = [
	0.22, 0.28, 0.31, 0.35, 0.29, 0.33, 0.27, 0.24, 0.26, 0.28,
];
