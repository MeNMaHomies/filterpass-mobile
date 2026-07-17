import { ApiError } from '@/api/errors';
import {
	assertBackendHealthy,
	HEALTH_NOT_READY_MESSAGE,
} from '@/lib/backendHealth';

describe('assertBackendHealthy', () => {
	it('returns health when status ok and model loaded', () => {
		const health = {
			status: 'ok',
			device: 'cpu',
			model_loaded: true,
		};
		expect(assertBackendHealthy(health)).toBe(health);
	});

	it('throws when model is not loaded', () => {
		expect(() =>
			assertBackendHealthy({
				status: 'ok',
				device: 'cpu',
				model_loaded: false,
			}),
		).toThrow(ApiError);
		try {
			assertBackendHealthy({
				status: 'ok',
				device: 'cpu',
				model_loaded: false,
			});
		} catch (e) {
			expect(e).toBeInstanceOf(ApiError);
			expect((e as ApiError).message).toBe(HEALTH_NOT_READY_MESSAGE);
			expect((e as ApiError).clientCode).toBe('backend_model_not_ready');
		}
	});

	it('throws when status is not ok', () => {
		expect(() =>
			assertBackendHealthy({
				status: 'starting',
				device: 'cpu',
				model_loaded: true,
			}),
		).toThrow(ApiError);
	});
});
