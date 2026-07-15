export type SessionLabel = 'REAL' | 'SPOOF';

export type RecentSession = {
	id: string;
	score: number;
	label: SessionLabel;
};

export type HistorySession = {
	id: string;
	label: SessionLabel;
	score: number;
	duration: string;
	ago: string;
};

export type ChunkTimelineItem = {
	time: string;
	score: number;
	label: SessionLabel;
};
