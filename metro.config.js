const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const motiView = path.resolve(
	__dirname,
	'node_modules/moti/build/components/view.js',
);
const motiCore = path.resolve(
	__dirname,
	'node_modules/moti/build/core/index.js',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === 'moti/view') {
		return { type: 'sourceFile', filePath: motiView };
	}
	if (moduleName === 'moti/core') {
		return { type: 'sourceFile', filePath: motiCore };
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
