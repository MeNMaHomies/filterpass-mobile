import { AppShell } from '@/components';
import { SettingsScreen } from '@/features/settings';

export default function SettingsRoute() {
	return (
		<AppShell title="Settings">
			<SettingsScreen />
		</AppShell>
	);
}
