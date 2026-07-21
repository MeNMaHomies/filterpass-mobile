import { apiRequest } from '@/api/client';
import { createSession } from '@/api/sessions';

jest.mock('@/api/client', () => ({
	apiRequest: jest.fn(),
}));

const mockedApiRequest = jest.mocked(apiRequest);

describe('createSession', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('enforces fixed audio config for default and conflicting inputs', () => {
		createSession();
		createSession({
			sample_rate: 8000,
			chunk_duration_s: 0.5,
			chunk_overlap_s: 0.25,
			ema_alpha: 0.4,
		});

		const fixedConfig = {
			sample_rate: 16_000,
			chunk_duration_s: 4,
			chunk_overlap_s: 3,
		};

		expect(mockedApiRequest).toHaveBeenCalledTimes(2);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			1,
			'/sessions',
			expect.objectContaining({
				method: 'POST',
				body: expect.objectContaining(fixedConfig),
			}),
		);
		expect(mockedApiRequest).toHaveBeenNthCalledWith(
			2,
			'/sessions',
			expect.objectContaining({
				method: 'POST',
				body: expect.objectContaining({
					...fixedConfig,
					ema_alpha: 0.4,
				}),
			}),
		);
	});
});
