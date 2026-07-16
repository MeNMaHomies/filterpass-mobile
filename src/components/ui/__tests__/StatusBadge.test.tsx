import { render } from '@testing-library/react-native';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
	it('renders the label text', async () => {
		const { getByText } = await render(
			<StatusBadge label="Live" variant="REAL" />,
		);
		expect(getByText('Live')).toBeTruthy();
	});

	it('renders warmup variant', async () => {
		const { getByText } = await render(
			<StatusBadge label="Warming up" variant="WARMUP" />,
		);
		expect(getByText('Warming up')).toBeTruthy();
	});
});
