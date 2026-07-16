/**
 * Moti barrel (`import from 'moti'`) eagerly loads MotiSafeAreaView, which
 * pulls deprecated RN SafeAreaView and logs a WARN. Use aliased deep imports.
 */
export { View as MotiView } from 'moti/view';
export { AnimatePresence } from 'moti/core';
