import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button, Card, Eyebrow } from '@/components/filterpass';
import { colors, spacing } from '@/theme/tokens';
import { fontFamilies } from '@/theme/typography';

export function SettingsScreen() {
  const [threshold, setThreshold] = useState(0.5);
  const [ema, setEma] = useState(0.3);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.banner}>
        <Text style={styles.bannerText}>
          Settings apply to the <Text style={styles.bannerStrong}>next</Text> session
          only. Stored on device.
        </Text>
      </Card>

      <Eyebrow>Audio</Eyebrow>
      <Card style={styles.group}>
        {[
          ['Sample rate', '16000 Hz'],
          ['Chunk duration', '0.5 s'],
          ['Max frame', '32 KB'],
        ].map(([k, v], i, arr) => (
          <View
            key={k}
            style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
          >
            <Text style={styles.rowLabel}>{k}</Text>
            <Text style={styles.rowValue}>{v}</Text>
          </View>
        ))}
      </Card>

      <Eyebrow>Inference</Eyebrow>
      <Card style={styles.group}>
        <View style={styles.sliderBlock}>
          <View style={styles.sliderHeader}>
            <Text style={styles.rowLabel}>Spoof threshold</Text>
            <Text style={styles.sliderValue}>{threshold.toFixed(2)}</Text>
          </View>
          <Slider
            minimumValue={0.1}
            maximumValue={0.9}
            step={0.05}
            value={threshold}
            onValueChange={setThreshold}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
        <View style={styles.sliderBlock}>
          <View style={styles.sliderHeader}>
            <Text style={styles.rowLabel}>EMA α</Text>
            <Text style={styles.sliderValue}>{ema.toFixed(2)}</Text>
          </View>
          <Slider
            minimumValue={0.1}
            maximumValue={0.9}
            step={0.05}
            value={ema}
            onValueChange={setEma}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          variant="ghost"
          label="Reset"
          style={styles.actionBtn}
          onPress={() => {
            setThreshold(0.5);
            setEma(0.3);
          }}
        />
        <Button
          variant="solid"
          label="Save"
          style={styles.actionBtn}
          onPress={() => console.log('Settings saved (mock)', { threshold, ema })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.contentBottom,
  },
  banner: {
    padding: 14,
    marginBottom: 16,
    backgroundColor: colors.primarySoft,
    borderColor: 'rgba(59,130,246,0.28)',
  },
  bannerText: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },
  bannerStrong: {
    color: colors.foreground,
    fontFamily: fontFamilies.sansSemibold,
  },
  group: {
    padding: 14,
    marginBottom: 14,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    color: colors.foreground,
  },
  sliderBlock: {
    marginBottom: 18,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
