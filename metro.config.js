const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const callCaptureRoot = path.resolve(projectRoot, 'modules/filterpass-call-capture');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// npm `file:` deps are symlinks. On Windows, Metro's file map often fails to
// treat those node_modules entries as directories, so bare imports break.
// Resolve the local Expo module via its real path instead.
config.watchFolders = [
	...new Set([projectRoot, ...(config.watchFolders ?? []), callCaptureRoot]),
];
config.resolver.extraNodeModules = {
	...(config.resolver.extraNodeModules ?? {}),
	'filterpass-call-capture': callCaptureRoot,
};

module.exports = config;
