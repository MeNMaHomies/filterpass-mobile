package expo.modules.filterpasscallcapture

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent

/**
 * Scaffold AccessibilityService for Call Scan.
 * Phase 3 wires AudioRecord workers into this service.
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
		// Phase 3 may observe call UI transitions. Scaffold ignores events.
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
