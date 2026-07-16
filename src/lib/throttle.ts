export function throttle<T extends (...args: never[]) => void>(
	fn: T,
	intervalMs: number,
): (...args: Parameters<T>) => void {
	let last = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let pendingArgs: Parameters<T> | null = null;

	const flush = () => {
		if (!pendingArgs) return;
		const args = pendingArgs;
		pendingArgs = null;
		last = Date.now();
		fn(...args);
	};

	return (...args: Parameters<T>) => {
		pendingArgs = args;
		const elapsed = Date.now() - last;

		if (elapsed >= intervalMs) {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			flush();
			return;
		}

		if (!timer) {
			timer = setTimeout(() => {
				timer = null;
				flush();
			}, intervalMs - elapsed);
		}
	};
}
