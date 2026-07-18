import {
	deriveListeningStatus,
	formatElapsed,
	formatVerdictHeadline,
} from '../liveVerdict';

describe('liveVerdict', () => {
	it('maps labels to plain headlines', () => {
		expect(formatVerdictHeadline('REAL')).toBe('Sounds real');
		expect(formatVerdictHeadline('UNCERTAIN')).toBe('Not sure yet');
		expect(formatVerdictHeadline('SPOOF')).toBe('Likely synthetic');
	});

	it('formats elapsed time', () => {
		expect(formatElapsed(0)).toBe('0:00');
		expect(formatElapsed(65)).toBe('1:05');
	});

	it('derives listening status', () => {
		expect(deriveListeningStatus(null, 0, 0)).toBe('waiting');
		expect(deriveListeningStatus(true, 5, 3)).toBe('speech');
		expect(deriveListeningStatus(false, 10, 1)).toBe('quiet');
		expect(deriveListeningStatus(false, 4, 1)).toBe('speech');
	});
});
