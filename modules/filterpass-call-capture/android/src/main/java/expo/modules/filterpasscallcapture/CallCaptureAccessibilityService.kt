package expo.modules.filterpasscallcapture

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility service required for showcase call-path capture on Android OEMs.
 * Dual AudioRecord workers run from the Expo module once this service is connected.
 */
class CallCaptureAccessibilityService : AccessibilityService() {
	override fun onServiceConnected() {
		super.onServiceConnected()
		serviceInfo =
			serviceInfo?.apply {
				eventTypes =
					AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
						AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
				feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
				flags = AccessibilityServiceInfo.DEFAULT
				notificationTimeout = 100
			}
		isConnected = true
		FilterpassCallCaptureModule.emitStatus(
			mapOf(
				"type" to "accessibility",
				"enabled" to true,
				"connected" to true,
			),
		)
	}

	override fun onAccessibilityEvent(event: AccessibilityEvent?) {
		// Showcase build does not drive capture from UI events.
	}

	override fun onInterrupt() {
		// No-op for scaffold.
	}

	override fun onDestroy() {
		isConnected = false
		FilterpassCallCaptureModule.emitStatus(
			mapOf(
				"type" to "accessibility",
				"enabled" to true,
				"connected" to false,
			),
		)
		super.onDestroy()
	}

	companion object {
		@Volatile
		var isConnected: Boolean = false
			private set
	}
}
