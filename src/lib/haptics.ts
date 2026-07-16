import * as Haptics from 'expo-haptics';

export async function hapticLight(): Promise<void> {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	} catch {
		// Haptics unavailable (web / simulator without support).
	}
}

export async function hapticMedium(): Promise<void> {
	try {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	} catch {
		// ignore
	}
}

export async function hapticSuccess(): Promise<void> {
	try {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	} catch {
		// ignore
	}
}

export async function hapticWarning(): Promise<void> {
	try {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
	} catch {
		// ignore
	}
}

export async function hapticError(): Promise<void> {
	try {
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	} catch {
		// ignore
	}
}
