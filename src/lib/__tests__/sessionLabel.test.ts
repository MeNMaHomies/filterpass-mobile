import { deriveSessionLabel } from '@/lib/sessionLabel';

describe('deriveSessionLabel', () => {
	it('returns REAL when score is below threshold', () => {
		expect(deriveSessionLabel(0.49, 0.5)).toBe('REAL');
	});

	it('returns SPOOF when score equals threshold', () => {
		expect(deriveSessionLabel(0.5, 0.5)).toBe('SPOOF');
	});

	it('returns SPOOF when score is above threshold', () => {
		expect(deriveSessionLabel(0.82, 0.5)).toBe('SPOOF');
	});
});
