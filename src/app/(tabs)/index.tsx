import { AppShell } from '@/components';
import { HomeScreen } from '@/features/home';

export default function HomeRoute() {
	return (
		<AppShell title="Overview">
			<HomeScreen />
		</AppShell>
	);
}
