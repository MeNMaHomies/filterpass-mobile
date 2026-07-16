/**
 * Moti barrel (`import from 'moti'`) eagerly loads MotiSafeAreaView, which
 * pulls deprecated RN SafeAreaView and logs a WARN.
 *
 * Moti's package.json "exports" blocks package subpaths like `moti/view`.
 * Relative file imports bypass that and still avoid the SafeAreaView barrel.
 */
export { View as MotiView } from '../../node_modules/moti/build/components/view.js';
export { AnimatePresence } from 'framer-motion';
