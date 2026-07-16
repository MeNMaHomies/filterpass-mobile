// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
	...expoConfig,
	{
		ignores: ['dist/*', '.expo/*', 'node_modules/*'],
	},
	{
		rules: {
			'react/jsx-no-leaked-render': [
				'error',
				{ validStrategies: ['ternary', 'coerce'] },
			],
		},
	},
	{
		files: ['src/features/**/hooks/**/*.{ts,tsx}'],
		rules: {
			'react-hooks/set-state-in-effect': 'off',
		},
	},
]);
