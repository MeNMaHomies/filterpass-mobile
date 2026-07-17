const fs = require('fs');
const path = require('path');
const {
	AndroidConfig,
	withAndroidManifest,
	withDangerousMod,
	withStringsXml,
} = require('expo/config-plugins');

const SERVICE_NAME =
	'expo.modules.filterpasscallcapture.CallCaptureAccessibilityService';
const ACCESSIBILITY_META_NAME = 'android.accessibilityservice';
const ACCESSIBILITY_RESOURCE = '@xml/filterpass_call_capture_accessibility';
const DESCRIPTION_STRING_NAME =
	'filterpass_call_capture_accessibility_description';
const DESCRIPTION_STRING_VALUE =
	'FilterPass Call Capture needs Accessibility access so it can record during phone calls on this device for the showcase build.';
const ACCESSIBILITY_XML_FILENAME = 'filterpass_call_capture_accessibility.xml';

/**
 * Idempotent config plugin for FilterPass call capture.
 * Merges RECORD_AUDIO / MODIFY_AUDIO_SETTINGS and registers the AccessibilityService
 * without duplicating entries on repeated prebuilds.
 */
function withFilterpassCallCapture(config) {
	config = withCallCapturePermissions(config);
	config = withCallCaptureStrings(config);
	config = withCallCaptureAccessibilityXml(config);
	config = withCallCaptureService(config);
	return config;
}

function withCallCaptureAccessibilityXml(config) {
	return withDangerousMod(config, [
		'android',
		async (config) => {
			const projectRoot = config.modRequest.projectRoot;
			const source = path.join(
				projectRoot,
				'modules',
				'filterpass-call-capture',
				'android',
				'src',
				'main',
				'res',
				'xml',
				ACCESSIBILITY_XML_FILENAME,
			);
			const destDir = path.join(
				projectRoot,
				'android',
				'app',
				'src',
				'main',
				'res',
				'xml',
			);
			const dest = path.join(destDir, ACCESSIBILITY_XML_FILENAME);
			fs.mkdirSync(destDir, { recursive: true });
			fs.copyFileSync(source, dest);
			return config;
		},
	]);
}

function withCallCapturePermissions(config) {
	return AndroidConfig.Permissions.withPermissions(config, [
		'android.permission.RECORD_AUDIO',
		'android.permission.MODIFY_AUDIO_SETTINGS',
	]);
}

function withCallCaptureStrings(config) {
	return withStringsXml(config, (config) => {
		config.modResults = AndroidConfig.Strings.setStringItem(
			[
				{
					$: {
						name: DESCRIPTION_STRING_NAME,
						translatable: 'false',
					},
					_: DESCRIPTION_STRING_VALUE,
				},
			],
			config.modResults,
		);
		return config;
	});
}

function withCallCaptureService(config) {
	return withAndroidManifest(config, (config) => {
		const manifest = config.modResults;
		const application =
			AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
		ensureArray(application, 'service');

		const existing = application.service.find(
			(service) => service.$?.['android:name'] === SERVICE_NAME,
		);

		const serviceEntry = {
			$: {
				'android:name': SERVICE_NAME,
				'android:exported': 'true',
				'android:permission':
					'android.permission.BIND_ACCESSIBILITY_SERVICE',
				'android:label': `@string/${DESCRIPTION_STRING_NAME}`,
			},
			'intent-filter': [
				{
					action: [
						{
							$: {
								'android:name':
									'android.accessibilityservice.AccessibilityService',
							},
						},
					],
				},
			],
			'meta-data': [
				{
					$: {
						'android:name': ACCESSIBILITY_META_NAME,
						'android:resource': ACCESSIBILITY_RESOURCE,
					},
				},
			],
		};

		if (existing) {
			Object.assign(existing, serviceEntry);
		} else {
			application.service.push(serviceEntry);
		}

		return config;
	});
}

function ensureArray(parent, key) {
	if (!parent[key]) {
		parent[key] = [];
	} else if (!Array.isArray(parent[key])) {
		parent[key] = [parent[key]];
	}
}

module.exports = withFilterpassCallCapture;
