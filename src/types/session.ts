export type SessionLabel = 'REAL' | 'SPOOF';

export type RecentSession = {
	id: string;
	sessionId: string;
	score: number;
	label: SessionLabel;
};

export type HistorySession = {
	id: string;
	label: SessionLabel;
	score: number;
	duration: string;
	ago: string;
	/** Unix seconds used for day grouping (closed_at ?? created_at). */
	sortTs: number;
};

export type ChunkTimelineItem = {
	time: string;
	score: number;
	label: SessionLabel;
};
