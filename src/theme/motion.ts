/** Shared motion tokens — keep animations consistent and restrained. */

export const motion = {
	pressScale: 0.97,
	/** Spring for press / settle */
	press: {
		damping: 18,
		stiffness: 320,
		mass: 0.6,
	},
	/** Short enter for screens / cards */
	enter: {
		duration: 220,
	},
	/** Live phase crossfade */
	phase: {
		duration: 180,
	},
	/** Score gauge spring */
	gauge: {
		damping: 16,
		stiffness: 140,
		mass: 0.8,
	},
	/** Max Moti stagger steps so long lists don’t lag */
	staggerMax: 8,
	staggerMs: 40,
} as const;

export const motiEnter = {
	from: { opacity: 0, translateY: 8 },
	animate: { opacity: 1, translateY: 0 },
	exit: { opacity: 0, translateY: -6 },
	transition: { type: 'timing' as const, duration: motion.enter.duration },
};

export const motiPhase = {
	from: { opacity: 0, translateY: 10 },
	animate: { opacity: 1, translateY: 0 },
	exit: { opacity: 0, translateY: -8 },
	transition: { type: 'timing' as const, duration: motion.phase.duration },
};
