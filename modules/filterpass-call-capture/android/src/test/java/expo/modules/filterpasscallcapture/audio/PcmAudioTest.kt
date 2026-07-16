package expo.modules.filterpasscallcapture.audio

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class Pcm16CodecTest {
	@Test
	fun `round trips signed PCM16 little endian`() {
		val samples =
			shortArrayOf(
				Short.MIN_VALUE,
				-1,
				0,
				1,
				Short.MAX_VALUE,
			)

		val encoded = Pcm16Codec.toLittleEndian(samples)

		assertArrayEquals(
			byteArrayOf(0, -128, -1, -1, 0, 0, 1, 0, -1, 127),
			encoded,
		)
		assertArrayEquals(samples, Pcm16Codec.fromLittleEndian(encoded))
	}

	@Test(expected = IllegalArgumentException::class)
	fun `rejects partial PCM16 sample`() {
		Pcm16Codec.fromLittleEndian(byteArrayOf(1))
	}
}

class Pcm16MixerTest {
	@Test
	fun `mixes two sources at equal gain`() {
		val mixed =
			Pcm16Mixer.mixEqualGain(
				shortArrayOf(10_000, -10_000, Short.MAX_VALUE),
				shortArrayOf(20_000, -20_000, Short.MAX_VALUE),
			)

		assertArrayEquals(
			shortArrayOf(15_000, -15_000, Short.MAX_VALUE),
			mixed,
		)
	}

	@Test(expected = IllegalArgumentException::class)
	fun `rejects frames with different sizes`() {
		Pcm16Mixer.mixEqualGain(shortArrayOf(1), shortArrayOf(1, 2))
	}
}

class LinearPcmResamplerTest {
	@Test
	fun `downsamples 48 kHz to exact 16 kHz frame`() {
		val input = ShortArray(4_800) { index -> index.toShort() }

		val output = LinearPcmResampler.resample(input, 48_000)

		assertEquals(PcmFormat.FRAME_SAMPLES, output.size)
		assertEquals(0, output.first().toInt())
		assertEquals(4_797, output.last().toInt())
	}

	@Test
	fun `returns copy when sample rate already matches`() {
		val input = shortArrayOf(1, 2, 3)

		val output = LinearPcmResampler.resample(input, 16_000)

		assertArrayEquals(input, output)
		assertTrue(input !== output)
	}
}

class PcmFrameChunkerTest {
	@Test
	fun `holds partial samples and emits exact 100 ms frames`() {
		val chunker = PcmFrameChunker()

		assertTrue(chunker.offer(ShortArray(800) { 1 }, 16_000).isEmpty())
		val output = chunker.offer(ShortArray(2_400) { 2 }, 16_000)

		assertEquals(2, output.size)
		assertEquals(PcmFormat.FRAME_SAMPLES, output[0].size)
		assertEquals(PcmFormat.FRAME_SAMPLES, output[1].size)
		assertEquals(0, chunker.pendingSamples())
		assertEquals(1, output[0].first().toInt())
		assertEquals(2, output[0].last().toInt())
	}

	@Test
	fun `resamples before framing`() {
		val frames = PcmFrameChunker().offer(ShortArray(4_800) { 7 }, 48_000)

		assertEquals(1, frames.size)
		assertEquals(PcmFormat.FRAME_SAMPLES, frames.single().size)
		assertTrue(frames.single().all { it.toInt() == 7 })
	}
}

class BoundedPcmFrameQueueTest {
	@Test
	fun `drops oldest frame when capacity is exceeded`() {
		val queue = BoundedPcmFrameQueue(capacity = 2)
		queue.offer(frame(timestampMs = 0, value = 1))
		queue.offer(frame(timestampMs = 100, value = 2))
		queue.offer(frame(timestampMs = 200, value = 3))

		assertEquals(2, queue.size())
		assertEquals(100, queue.poll()!!.timestampMs)
		assertEquals(200, queue.poll()!!.timestampMs)
	}
}

class PcmFrameAlignerTest {
	@Test
	fun `mixes frames inside timestamp tolerance`() {
		val aligner = PcmFrameAligner()

		assertTrue(aligner.offerCall(frame(timestampMs = 1_000, value = 10_000)).isEmpty())
		val output = aligner.offerMic(frame(timestampMs = 1_025, value = 20_000))

		assertEquals(1, output.size)
		assertEquals(1_000, output.single().timestampMs)
		assertTrue(output.single().samples.all { it.toInt() == 15_000 })
	}

	@Test
	fun `passes earlier unmatched frame and flushes surviving source`() {
		val aligner = PcmFrameAligner()
		assertTrue(aligner.offerCall(frame(timestampMs = 0, value = 10)).isEmpty())

		val comparable = aligner.offerMic(frame(timestampMs = 200, value = 20))
		val remaining = aligner.flush()

		assertEquals(1, comparable.size)
		assertEquals(0, comparable.single().timestampMs)
		assertTrue(comparable.single().samples.all { it.toInt() == 10 })
		assertEquals(1, remaining.size)
		assertEquals(200, remaining.single().timestampMs)
		assertTrue(remaining.single().samples.all { it.toInt() == 20 })
	}
}

private fun frame(
	timestampMs: Long,
	value: Int,
): TimestampedPcmFrame =
	TimestampedPcmFrame(
		timestampMs = timestampMs,
		samples = ShortArray(PcmFormat.FRAME_SAMPLES) { value.toShort() },
	)
