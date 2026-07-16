/** @type {import('jest').Config} */
module.exports = {
	preset: 'jest-expo',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: [
		'**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
		'**/*.(test|spec).(ts|tsx|js|jsx)',
	],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
