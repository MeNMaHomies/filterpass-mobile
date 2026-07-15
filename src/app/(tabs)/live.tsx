import { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { AppShell, StatusBadge } from '@/components';
import {
	LiveActiveView,
	LiveIdleView,
	LiveWarmupView,
} from '@/features/live';
import { colors } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type LivePhase = 'idle' | 'active' | 'warmup';

const PHASES: LivePhase[] = ['idle', 'active', 'warmup'];

export default function LiveRoute() {
	const [phase, setPhase] = useState<LivePhase>('idle');

	const cyclePhase = () => {
		setPhase((current) => {
			const idx = PHASES.indexOf(current);
			return PHASES[(idx + 1) % PHASES.length] ?? 'idle';
		});
	};

	const subtitle = phase === 'idle' ? undefined : 'sess_a3f9c2e1';

	return (
		<AppShell
			title="Live Monitor"
			subtitle={subtitle}
			headerRight={
				phase === 'active' || phase === 'warmup' ? (
					<StatusBadge
						label={phase === 'warmup' ? 'Warming up' : 'Live'}
						variant={phase === 'warmup' ? 'WARMUP' : 'REAL'}
					/>
				) : null
			}
		>
			{phase === 'idle' ? <LiveIdleView onMicPress={cyclePhase} /> : null}
			{phase === 'active' ? (
				<LiveActiveView onStop={() => setPhase('idle')} />
			) : null}
			{phase === 'warmup' ? (
				<LiveWarmupView onCancel={() => setPhase('idle')} />
			) : null}

			{__DEV__ ? (
				<View style={styles.devBar} pointerEvents="box-none">
					<Pressable style={styles.devToggle} onPress={cyclePhase}>
						<Text style={styles.devLabel}>Dev: {phase}</Text>
					</Pressable>
				</View>
			) : null}
		</AppShell>
	);
}

const styles = StyleSheet.create({
	devBar: {
		position: 'absolute',
		top: 8,
		right: 16,
		zIndex: 10,
	},
	devToggle: {
		backgroundColor: colors.card2,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	devLabel: {
		fontFamily: fontFamilies.mono,
		fontSize: 10,
		color: colors.muted,
		textTransform: 'uppercase',
	},
});
