import { type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eyebrow } from '@/components/ui';
import { colors, spacing, titleGradient } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type AppShellProps = {
	title: string;
	subtitle?: string;
	headerRight?: ReactNode;
	onBack?: () => void;
	children: ReactNode;
};

export function AppShell({
	title,
	subtitle,
	headerRight,
	onBack,
	children,
}: AppShellProps) {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.root}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<View style={styles.headerRow}>
					{onBack ? (
						<Pressable
							onPress={onBack}
							style={({ pressed }) => [
								styles.backBtn,
								pressed && styles.backPressed,
							]}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="Go back"
						>
							<ChevronLeft
								size={22}
								color={colors.foreground}
								strokeWidth={2}
							/>
						</Pressable>
					) : null}
					<View style={styles.headerText}>
						<Eyebrow>FilterPass</Eyebrow>
						<MaskedView
							maskElement={<Text style={styles.titleMask}>{title}</Text>}
						>
							<LinearGradient
								colors={[...titleGradient]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
							>
								<Text style={[styles.titleMask, styles.titleHidden]}>
									{title}
								</Text>
							</LinearGradient>
						</MaskedView>
						{subtitle ? (
							<Text style={styles.subtitle}>{subtitle}</Text>
						) : null}
					</View>
					{headerRight}
				</View>
				<LinearGradient
					colors={[
						'transparent',
						'rgba(59,130,246,0.5)',
						'rgba(245,158,11,0.45)',
						'transparent',
					]}
					locations={[0, 0.3, 0.7, 1]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={styles.divider}
				/>
			</View>
			<View style={styles.content}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.background,
	},
	header: {
		paddingHorizontal: spacing.screenX,
		zIndex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: 8,
	},
	backBtn: {
		width: 44,
		height: 44,
		marginLeft: -8,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
	},
	backPressed: {
		opacity: 0.7,
	},
	headerText: {
		flex: 1,
	},
	titleMask: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 22,
		fontWeight: '600',
		letterSpacing: -0.88,
		lineHeight: 26,
		marginTop: 2,
	},
	titleHidden: {
		opacity: 0,
	},
	subtitle: {
		fontFamily: fontFamilies.mono,
		fontSize: 11,
		color: colors.muted2,
		marginTop: 4,
	},
	divider: {
		height: 1,
		marginTop: 12,
	},
	content: {
		flex: 1,
		zIndex: 1,
	},
});
