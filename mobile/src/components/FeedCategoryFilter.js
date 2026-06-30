import { useCallback, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FEED_CATEGORIES, OFFICIAL_ONLY_TOOLTIP } from '../config/constants';
import { colors, fontFamilies, radii, shadows, spacing, typography } from '../theme/tokens';

function SectionChip({ label, tooltip, active, onPress, onShowTooltip, style }) {
  const suppressPressRef = useRef(false);

  const handleLongPress = useCallback(() => {
    suppressPressRef.current = true;
    onShowTooltip(tooltip);
  }, [onShowTooltip, tooltip]);

  const handlePress = useCallback(() => {
    if (suppressPressRef.current) {
      suppressPressRef.current = false;
      return;
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      accessibilityHint={tooltip}
      accessibilityRole="button"
      delayLongPress={450}
      onLongPress={handleLongPress}
      onPress={handlePress}
      style={[styles.chip, active && styles.chipActive, style]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function FeedCategoryFilter({
  selectedCategory,
  officialOnly,
  onCategoryChange,
  onOfficialOnlyChange,
}) {
  const [tooltipText, setTooltipText] = useState(null);

  const dismissTooltip = useCallback(() => setTooltipText(null), []);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Sections</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        clipToPadding={false}
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {FEED_CATEGORIES.map((cat) => (
          <SectionChip
            key={cat.id}
            active={selectedCategory === cat.id}
            label={cat.label}
            tooltip={cat.tooltip}
            onPress={() => onCategoryChange(cat.id)}
            onShowTooltip={setTooltipText}
          />
        ))}
      </ScrollView>
      <View style={styles.officialRow}>
        <SectionChip
          active={officialOnly}
          label="Official only"
          style={styles.chipOfficial}
          tooltip={OFFICIAL_ONLY_TOOLTIP}
          onPress={() => onOfficialOnlyChange(!officialOnly)}
          onShowTooltip={setTooltipText}
        />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={dismissTooltip}
        transparent
        visible={Boolean(tooltipText)}
      >
        <Pressable accessibilityRole="button" onPress={dismissTooltip} style={styles.modalBackdrop}>
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipText}>{tooltipText}</Text>
            <Text style={styles.tooltipDismiss}>Tap anywhere to dismiss</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
  },
  label: {
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  chipScroll: {
    marginHorizontal: -spacing.lg,
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  officialRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.chipBg,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipOfficial: {
    borderColor: colors.goldMuted,
  },
  chipActive: {
    backgroundColor: colors.chipActiveBg,
    borderColor: colors.chipActiveBg,
  },
  chipText: {
    ...typography.uiLabel,
    color: colors.inkSoft,
    flexShrink: 0,
  },
  chipTextActive: {
    color: colors.chipActiveText,
    fontFamily: fontFamilies.uiSemi,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  tooltipCard: {
    backgroundColor: colors.disclaimerBg,
    borderColor: colors.goldMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  tooltipText: {
    ...typography.uiLabel,
    color: colors.disclaimerText,
    lineHeight: 20,
    textAlign: 'center',
  },
  tooltipDismiss: {
    ...typography.meta,
    color: colors.inkLight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
