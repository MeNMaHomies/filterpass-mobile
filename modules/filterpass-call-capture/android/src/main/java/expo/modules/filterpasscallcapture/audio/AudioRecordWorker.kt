package expo.modules.filterpasscallcapture.audio

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import android.util.Log

/**
 * Best-effort PCM reader for one audio source.
 *
 * Tries preferred [MediaRecorder.AudioSource] values and native sample rates,
 * then resamples/chunks into fixed 100 ms frames via [PcmFrameChunker].
 */
class AudioRecordWorker(
	private val label: String,
	private val preferredSources: IntArray,
	private val preferredSampleRates: IntArray =
		intArrayOf(
			PcmFormat.TARGET_SAMPLE_RATE,
			48_000,
			44_100,
			8_000,
		),
	private val onFrame: (TimestampedPcmFrame) -> Unit,
	private val onStatus: (Map<String, Any?>) -> Unit,
) {
	@Volatile
	private var running = false

	private var thread: Thread? = null

	fun start() {
		if (running) return
		running = true
		thread =
			Thread({
				Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
				runCaptureLoop()
			}, "fp-capture-$label").also { it.start() }
	}

	fun stop() {
		running = false
		thread?.join(1_500)
		thread = null
	}

	private fun runCaptureLoop() {
		val opened = openRecorder()
		if (opened == null) {
			onStatus(
				mapOf(
					"type" to "recorder",
					"state" to "failed",
					"source" to label,
					"message" to "No usable AudioRecord source for $label",
				),
			)
			running = false
			return
		}

		val (recorder, source, nativeRate) = opened
		val chunker = PcmFrameChunker()
		val buffer = ShortArray(recorder.bufferSizeInFrames.coerceAtLeast(PcmFormat.FRAME_SAMPLES))

		onStatus(
			mapOf(
				"type" to "recorder",
				"state" to "started",
				"source" to label,
				"audioSource" to sourceName(source),
				"nativeSampleRate" to nativeRate,
			),
		)

		try {
			recorder.startRecording()
			while (running) {
				val read = recorder.read(buffer, 0, buffer.size)
				if (read <= 0) {
					if (read == AudioRecord.ERROR_INVALID_OPERATION ||
						read == AudioRecord.ERROR_BAD_VALUE
					) {
						onStatus(
							mapOf(
								"type" to "recorder",
								"state" to "error",
								"source" to label,
								"message" to "AudioRecord.read failed ($read)",
							),
						)
						break
					}
					continue
				}

				val samples = buffer.copyOf(read)
				val frames = chunker.offer(samples, nativeRate)
				val now = System.currentTimeMillis()
				frames.forEachIndexed { index, frame ->
					onFrame(
						TimestampedPcmFrame(
							timestampMs = now + index * PcmFormat.FRAME_DURATION_MS,
							samples = frame,
						),
					)
				}
			}
		} catch (error: Exception) {
			Log.w(TAG, "Capture loop failed for $label", error)
			onStatus(
				mapOf(
					"type" to "recorder",
					"state" to "error",
					"source" to label,
					"message" to (error.message ?: error.javaClass.simpleName),
				),
			)
		} finally {
			try {
				if (recorder.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
					recorder.stop()
				}
			} catch (_: Exception) {
				// best effort
			}
			recorder.release()
			onStatus(
				mapOf(
					"type" to "recorder",
					"state" to "stopped",
					"source" to label,
				),
			)
		}
	}

	private fun openRecorder(): Triple<AudioRecord, Int, Int>? {
		for (source in preferredSources) {
			for (rate in preferredSampleRates) {
				val minBuffer =
					AudioRecord.getMinBufferSize(
						rate,
						AudioFormat.CHANNEL_IN_MONO,
						AudioFormat.ENCODING_PCM_16BIT,
					)
				if (minBuffer <= 0) continue

				val bufferSize = (minBuffer * 2).coerceAtLeast(PcmFormat.FRAME_BYTES * 4)
				try {
					val recorder =
						AudioRecord(
							source,
							rate,
							AudioFormat.CHANNEL_IN_MONO,
							AudioFormat.ENCODING_PCM_16BIT,
							bufferSize,
						)
					if (recorder.state == AudioRecord.STATE_INITIALIZED) {
						return Triple(recorder, source, rate)
					}
					recorder.release()
				} catch (error: Exception) {
					Log.d(TAG, "AudioRecord open failed source=$source rate=$rate: ${error.message}")
				}
			}
		}
		return null
	}

	companion object {
		private const val TAG = "FpCallCapture"

		val MIC_SOURCES =
			intArrayOf(
				MediaRecorder.AudioSource.MIC,
				MediaRecorder.AudioSource.VOICE_RECOGNITION,
			)

		val CALL_SOURCES =
			intArrayOf(
				MediaRecorder.AudioSource.VOICE_COMMUNICATION,
				MediaRecorder.AudioSource.VOICE_RECOGNITION,
				MediaRecorder.AudioSource.CAMCORDER,
				MediaRecorder.AudioSource.UNPROCESSED,
				MediaRecorder.AudioSource.MIC,
			)

		fun sourceName(source: Int): String =
			when (source) {
				MediaRecorder.AudioSource.MIC -> "MIC"
				MediaRecorder.AudioSource.VOICE_COMMUNICATION -> "VOICE_COMMUNICATION"
				MediaRecorder.AudioSource.VOICE_RECOGNITION -> "VOICE_RECOGNITION"
				MediaRecorder.AudioSource.CAMCORDER -> "CAMCORDER"
				MediaRecorder.AudioSource.UNPROCESSED -> "UNPROCESSED"
				MediaRecorder.AudioSource.VOICE_CALL -> "VOICE_CALL"
				else -> "SOURCE_$source"
			}
	}
}
