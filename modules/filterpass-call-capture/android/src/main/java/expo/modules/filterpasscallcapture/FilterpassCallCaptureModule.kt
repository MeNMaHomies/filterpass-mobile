package expo.modules.filterpasscallcapture

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import android.text.TextUtils
import expo.modules.filterpasscallcapture.audio.DualCaptureEngine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FilterpassCallCaptureModule : Module() {
	private var engine: DualCaptureEngine? = null

	override fun definition() =
		ModuleDefinition {
			Name("FilterpassCallCapture")

			Events(EVENT_STATUS, EVENT_PCM)

			OnCreate {
				moduleInstance = this@FilterpassCallCaptureModule
			}

			OnDestroy {
				engine?.stop()
				engine = null
				if (moduleInstance === this@FilterpassCallCaptureModule) {
					moduleInstance = null
				}
			}

			Function("getAccessibilityStatus") {
				val context = appContext.reactContext ?: return@Function accessibilityStatus(false, false)
				val enabled = isAccessibilityServiceEnabled(context)
				accessibilityStatus(enabled, CallCaptureAccessibilityService.isConnected)
			}

			Function("openAccessibilitySettings") {
				val context =
					appContext.reactContext
						?: throw IllegalStateException("React context unavailable")
				val intent =
					Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
						addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
					}
				context.startActivity(intent)
			}

			AsyncFunction("start") { sampleRate: Int ->
				val context =
					appContext.reactContext
						?: throw IllegalStateException("React context unavailable")

				if (!isAccessibilityServiceEnabled(context)) {
					throw IllegalStateException("Accessibility service is disabled")
				}
				if (!CallCaptureAccessibilityService.isConnected) {
					throw IllegalStateException("Accessibility service is not connected")
				}
				if (
					context.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
					!= PackageManager.PERMISSION_GRANTED
				) {
					throw IllegalStateException("RECORD_AUDIO permission is required")
				}
				if (engine != null) {
					throw IllegalStateException("Capture already running")
				}

				val next =
					DualCaptureEngine(
						context = context,
						onPcm = { payload -> emitPcm(payload) },
						onStatus = { payload -> emitStatus(payload) },
					)
				engine = next
				try {
					next.start(sampleRate)
				} catch (error: Exception) {
					engine = null
					throw error
				}
			}

			AsyncFunction("stop") {
				val current = engine
				engine = null
				current?.stop()
				if (current == null) {
					emitStatus(
						mapOf(
							"type" to "capture",
							"state" to "stopped",
						),
					)
				}
			}
		}

	private fun accessibilityStatus(
		enabled: Boolean,
		connected: Boolean,
	): Map<String, Any> =
		mapOf(
			"enabled" to enabled,
			"connected" to connected,
		)

	private fun isAccessibilityServiceEnabled(context: Context): Boolean {
		val expected =
			ComponentName(context, CallCaptureAccessibilityService::class.java).flattenToString()
		val enabledServices =
			Settings.Secure.getString(
				context.contentResolver,
				Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
			) ?: return false

		val splitter = TextUtils.SimpleStringSplitter(':')
		splitter.setString(enabledServices)
		while (splitter.hasNext()) {
			val component = splitter.next()
			if (component.equals(expected, ignoreCase = true)) {
				return true
			}
		}
		return false
	}

	companion object {
		const val EVENT_STATUS = "onStatus"
		const val EVENT_PCM = "onPcm"

		@Volatile
		private var moduleInstance: FilterpassCallCaptureModule? = null

		fun emitStatus(payload: Map<String, Any?>) {
			moduleInstance?.sendEvent(EVENT_STATUS, payload)
		}

		fun emitPcm(payload: Map<String, Any?>) {
			moduleInstance?.sendEvent(EVENT_PCM, payload)
		}
	}
}
