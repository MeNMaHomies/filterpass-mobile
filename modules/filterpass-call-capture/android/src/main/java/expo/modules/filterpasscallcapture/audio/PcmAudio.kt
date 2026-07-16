package expo.modules.filterpasscallcapture.audio

import java.util.ArrayDeque
import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.roundToInt

object PcmFormat {
	const val TARGET_SAMPLE_RATE = 16_000
	const val FRAME_DURATION_MS = 100L
	const val FRAME_SAMPLES = TARGET_SAMPLE_RATE / 10
	const val FRAME_BYTES = FRAME_SAMPLES * Short.SIZE_BYTES
}

data class TimestampedPcmFrame(
	val timestampMs: Long,
	val samples: ShortArray,
) {
	init {
		require(samples.size == PcmFormat.FRAME_SAMPLES) {
			"Expected ${PcmFormat.FRAME_SAMPLES} samples, got ${samples.size}"
		}
	}
}

object Pcm16Codec {
	fun toLittleEndian(samples: ShortArray): ByteArray {
		val bytes = ByteArray(samples.size * Short.SIZE_BYTES)
		samples.forEachIndexed { index, sample ->
			val value = sample.toInt()
			bytes[index * 2] = (value and 0xff).toByte()
			bytes[index * 2 + 1] = ((value ushr 8) and 0xff).toByte()
		}
		return bytes
	}

	fun fromLittleEndian(bytes: ByteArray): ShortArray {
		require(bytes.size % Short.SIZE_BYTES == 0) {
			"PCM16 input must contain an even number of bytes"
		}
		return ShortArray(bytes.size / 2) { index ->
			val low = bytes[index * 2].toInt() and 0xff
			val high = bytes[index * 2 + 1].toInt()
			((high shl 8) or low).toShort()
		}
	}
}

object Pcm16Mixer {
	fun mixEqualGain(
		first: ShortArray,
		second: ShortArray,
	): ShortArray {
		require(first.size == second.size) {
			"PCM frames must have equal sample counts"
		}
		return ShortArray(first.size) { index ->
			val mixed =
				(first[index].toInt() * 0.5 + second[index].toInt() * 0.5)
					.roundToInt()
			mixed.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
		}
	}
}

object LinearPcmResampler {
	fun resample(
		samples: ShortArray,
		sourceSampleRate: Int,
		targetSampleRate: Int = PcmFormat.TARGET_SAMPLE_RATE,
	): ShortArray {
		require(sourceSampleRate > 0) { "Source sample rate must be positive" }
		require(targetSampleRate > 0) { "Target sample rate must be positive" }
		if (samples.isEmpty() || sourceSampleRate == targetSampleRate) {
			return samples.copyOf()
		}

		val outputSize =
			(samples.size.toDouble() * targetSampleRate / sourceSampleRate)
				.roundToInt()
				.coerceAtLeast(1)
		val sourceStep = sourceSampleRate.toDouble() / targetSampleRate

		return ShortArray(outputSize) { outputIndex ->
			val sourcePosition = outputIndex * sourceStep
			val lowerIndex = floor(sourcePosition).toInt().coerceIn(0, samples.lastIndex)
			val upperIndex = (lowerIndex + 1).coerceAtMost(samples.lastIndex)
			val fraction = sourcePosition - lowerIndex
			val interpolated =
				samples[lowerIndex] * (1.0 - fraction) + samples[upperIndex] * fraction
			interpolated
				.roundToInt()
				.coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
				.toShort()
		}
	}
}

class PcmFrameChunker(
	private val targetSampleRate: Int = PcmFormat.TARGET_SAMPLE_RATE,
) {
	private var pending = ShortArray(0)

	fun offer(
		samples: ShortArray,
		sourceSampleRate: Int,
	): List<ShortArray> {
		val normalized =
			LinearPcmResampler.resample(samples, sourceSampleRate, targetSampleRate)
		if (normalized.isEmpty()) return emptyList()

		pending += normalized
		val frames = mutableListOf<ShortArray>()
		while (pending.size >= PcmFormat.FRAME_SAMPLES) {
			frames += pending.copyOfRange(0, PcmFormat.FRAME_SAMPLES)
			pending = pending.copyOfRange(PcmFormat.FRAME_SAMPLES, pending.size)
		}
		return frames
	}

	fun reset() {
		pending = ShortArray(0)
	}

	fun pendingSamples(): Int = pending.size
}

class BoundedPcmFrameQueue(
	private val capacity: Int,
) {
	private val frames = ArrayDeque<TimestampedPcmFrame>()

	init {
		require(capacity > 0) { "Queue capacity must be positive" }
	}

	fun offer(frame: TimestampedPcmFrame) {
		while (frames.size >= capacity) {
			frames.removeFirst()
		}
		frames.addLast(frame)
	}

	fun peek(): TimestampedPcmFrame? = frames.peekFirst()

	fun poll(): TimestampedPcmFrame? = frames.pollFirst()

	fun size(): Int = frames.size

	fun clear() = frames.clear()
}

/**
 * Aligns fixed 100 ms frames from two independent recorders.
 *
 * Close timestamps are mixed. An older unmatched frame passes through once a
 * frame from the other source proves it cannot be paired. Remaining frames are
 * emitted by [flush], which Phase 3 uses when either recorder stops.
 */
class PcmFrameAligner(
	maxBufferedFrames: Int = 5,
	private val toleranceMs: Long = PcmFormat.FRAME_DURATION_MS / 2,
) {
	private val callFrames = BoundedPcmFrameQueue(maxBufferedFrames)
	private val micFrames = BoundedPcmFrameQueue(maxBufferedFrames)

	fun offerCall(frame: TimestampedPcmFrame): List<TimestampedPcmFrame> {
		callFrames.offer(frame)
		return drainComparableFrames()
	}

	fun offerMic(frame: TimestampedPcmFrame): List<TimestampedPcmFrame> {
		micFrames.offer(frame)
		return drainComparableFrames()
	}

	fun flush(): List<TimestampedPcmFrame> {
		val output = drainComparableFrames().toMutableList()
		while (callFrames.size() > 0 || micFrames.size() > 0) {
			val call = callFrames.peek()
			val mic = micFrames.peek()
			when {
				call == null -> output += micFrames.poll()!!
				mic == null -> output += callFrames.poll()!!
				call.timestampMs <= mic.timestampMs -> output += callFrames.poll()!!
				else -> output += micFrames.poll()!!
			}
		}
		return output
	}

	fun clear() {
		callFrames.clear()
		micFrames.clear()
	}

	private fun drainComparableFrames(): List<TimestampedPcmFrame> {
		val output = mutableListOf<TimestampedPcmFrame>()
		while (true) {
			val call = callFrames.peek() ?: break
			val mic = micFrames.peek() ?: break
			val delta = call.timestampMs - mic.timestampMs

			when {
				abs(delta) <= toleranceMs -> {
					callFrames.poll()
					micFrames.poll()
					output +=
						TimestampedPcmFrame(
							timestampMs = minOf(call.timestampMs, mic.timestampMs),
							samples = Pcm16Mixer.mixEqualGain(call.samples, mic.samples),
						)
				}
				delta < 0 -> output += callFrames.poll()!!
				else -> output += micFrames.poll()!!
			}
		}
		return output
	}
}
