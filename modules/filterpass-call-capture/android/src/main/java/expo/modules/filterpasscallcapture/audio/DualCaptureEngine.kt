package expo.modules.filterpasscallcapture.audio

import android.content.Context
import android.media.AudioManager
import android.util.Base64
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Runs mic + call-path AudioRecord workers, aligns 100 ms frames, and emits
 * mixed (or single-source) PCM16 LE frames as base64 payloads.
 *
 * Best-effort: if one recorder fails, the other continues. Backend decides usefulness.
 */
class DualCaptureEngine(
	context: Context,
	private val onPcm: (Map<String, Any?>) -> Unit,
	private val onStatus: (Map<String, Any?>) -> Unit,
) {
	private val audioManager =
		context.applicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
	private val aligner = PcmFrameAligner()
	private val alignLock = Any()
	private val running = AtomicBoolean(false)

	private var previousMode = AudioManager.MODE_NORMAL
	private var micWorker: AudioRecordWorker? = null
	private var callWorker: AudioRecordWorker? = null

	fun start(sampleRate: Int) {
		if (!running.compareAndSet(false, true)) {
			throw IllegalStateException("Capture already running")
		}

		val targetRate =
			if (sampleRate > 0) sampleRate else PcmFormat.TARGET_SAMPLE_RATE

		previousMode = audioManager.mode
		try {
			audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
		} catch (_: Exception) {
			// OEMs may reject mode changes; capture still proceeds.
		}

		synchronized(alignLock) {
			aligner.clear()
		}
		onStatus(
			mapOf(
				"type" to "capture",
				"state" to "starting",
				"sampleRate" to targetRate,
			),
		)

		val rates =
			intArrayOf(
				targetRate,
				PcmFormat.TARGET_SAMPLE_RATE,
				48_000,
				44_100,
				8_000,
			)

		micWorker =
			AudioRecordWorker(
				label = "mic",
				preferredSources = AudioRecordWorker.MIC_SOURCES,
				preferredSampleRates = rates,
				onFrame = { frame ->
					emitFrames { aligner.offerMic(frame) }
				},
				onStatus = onStatus,
			)
		callWorker =
			AudioRecordWorker(
				label = "call",
				preferredSources = AudioRecordWorker.CALL_SOURCES,
				preferredSampleRates = rates,
				onFrame = { frame ->
					emitFrames { aligner.offerCall(frame) }
				},
				onStatus = onStatus,
			)

		micWorker?.start()
		callWorker?.start()

		onStatus(
			mapOf(
				"type" to "capture",
				"state" to "running",
				"sampleRate" to targetRate,
			),
		)
	}

	fun stop() {
		if (!running.compareAndSet(true, false)) return

		onStatus(mapOf("type" to "capture", "state" to "stopping"))

		micWorker?.stop()
		callWorker?.stop()
		micWorker = null
		callWorker = null

		emitFrames { aligner.flush() }

		try {
			audioManager.mode = previousMode
		} catch (_: Exception) {
			// ignore restore failures
		}

		onStatus(mapOf("type" to "capture", "state" to "stopped"))
	}

	private fun emitFrames(produce: () -> List<TimestampedPcmFrame>) {
		val frames = synchronized(alignLock) { produce() }
		for (frame in frames) {
			val bytes = Pcm16Codec.toLittleEndian(frame.samples)
			onPcm(
				mapOf(
					"data" to Base64.encodeToString(bytes, Base64.NO_WRAP),
					"sampleRate" to PcmFormat.TARGET_SAMPLE_RATE,
					"byteLength" to bytes.size,
				),
			)
		}
	}
}
