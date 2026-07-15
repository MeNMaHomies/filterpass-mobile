export type KpiItem = {
	label: string;
	value: string;
	live: boolean;
};

export const homeKpis: KpiItem[] = [
	{ label: 'Backend', value: 'OK', live: true },
	{ label: 'Live', value: '1', live: true },
	{ label: 'Chunks 24h', value: '4,218', live: false },
	{ label: 'Avg RTF', value: '0.31', live: false },
];
