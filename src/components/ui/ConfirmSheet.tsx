import { forwardRef, useCallback, useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import {
	BottomSheetBackdrop,
	BottomSheetModal,
	BottomSheetView,
	type BottomSheetBackdropProps,
	type BottomSheetModal as BottomSheetModalType,
} from '@gorhom/bottom-sheet';
import { Button } from '@/components/ui/Button';
import { hapticMedium } from '@/lib/haptics';
import { colors, radius } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

type ConfirmSheetProps = {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	onConfirm: () => void;
};

export const ConfirmSheet = forwardRef<BottomSheetModalType, ConfirmSheetProps>(
	function ConfirmSheet(
		{
			title,
			description,
			confirmLabel = 'Confirm',
			cancelLabel = 'Cancel',
			destructive = false,
			onConfirm,
		},
		ref,
	) {
		const snapPoints = useMemo(() => ['32%'], []);

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => (
				<BottomSheetBackdrop
					{...props}
					appearsOnIndex={0}
					disappearsOnIndex={-1}
					opacity={0.55}
				/>
			),
			[],
		);

		const dismiss = useCallback(() => {
			if (typeof ref !== 'function' && ref?.current) {
				ref.current.dismiss();
			}
		}, [ref]);

		const handleConfirm = useCallback(() => {
			void hapticMedium();
			dismiss();
			onConfirm();
		}, [dismiss, onConfirm]);

		return (
			<BottomSheetModal
				ref={ref}
				snapPoints={snapPoints}
				enablePanDownToClose
				backdropComponent={renderBackdrop}
				backgroundStyle={styles.sheet}
				handleIndicatorStyle={styles.handle}
			>
				<BottomSheetView style={styles.content}>
					<Text style={styles.title}>{title}</Text>
					{description ? (
						<Text style={styles.description}>{description}</Text>
					) : null}
					<View style={styles.actions}>
						<Button
							variant="ghost"
							label={cancelLabel}
							style={styles.action}
							onPress={dismiss}
						/>
						<Button
							variant={destructive ? 'danger' : 'solid'}
							label={confirmLabel}
							style={styles.action}
							onPress={handleConfirm}
						/>
					</View>
				</BottomSheetView>
			</BottomSheetModal>
		);
	},
);

const styles = StyleSheet.create({
	sheet: {
		backgroundColor: colors.card2,
		borderTopLeftRadius: radius.card,
		borderTopRightRadius: radius.card,
		borderCurve: 'continuous',
	},
	handle: {
		backgroundColor: colors.border,
		width: 40,
	},
	content: {
		paddingHorizontal: 20,
		paddingBottom: 28,
		gap: 10,
	},
	title: {
		fontFamily: fontFamilies.sansSemibold,
		fontSize: 17,
		color: colors.foreground,
		marginTop: 4,
	},
	description: {
		fontFamily: fontFamilies.sans,
		fontSize: 14,
		color: colors.muted,
		lineHeight: 20,
		marginBottom: 8,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 8,
	},
	action: {
		flex: 1,
	},
});
