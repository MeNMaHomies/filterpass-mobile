import { deriveSessionLabel } from '@/lib/sessionLabel';

describe('deriveSessionLabel', () => {
	it('returns REAL when score is below spoof threshold (binary)', () => {
		expect(deriveSessionLabel(0.49, 0.5)).toBe('REAL');
	});

	it('returns SPOOF when score equals spoof threshold', () => {
		expect(deriveSessionLabel(0.5, 0.5)).toBe('SPOOF');
	});

	it('returns SPOOF when score is above spoof threshold', () => {
		expect(deriveSessionLabel(0.82, 0.5)).toBe('SPOOF');
	});

	it('returns UNCERTAIN between real and spoof thresholds', () => {
		expect(deriveSessionLabel(0.5, 0.6, 0.4)).toBe('UNCERTAIN');
	});

	it('returns REAL below the real threshold', () => {
		expect(deriveSessionLabel(0.39, 0.6, 0.4)).toBe('REAL');
	});

	it('returns SPOOF at or above spoof with dual thresholds', () => {
		expect(deriveSessionLabel(0.6, 0.6, 0.4)).toBe('SPOOF');
		expect(deriveSessionLabel(0.75, 0.6, 0.4)).toBe('SPOOF');
	});

	it('treats score equal to real threshold as UNCERTAIN', () => {
		expect(deriveSessionLabel(0.4, 0.6, 0.4)).toBe('UNCERTAIN');
	});
});
