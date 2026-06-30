import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FEED_CATEGORIES } from '../config/constants';
import { colors, fontFamilies, radii, spacing, typography } from '../theme/tokens';

export function FeedCategoryFilter({
  selectedCategory,
  officialOnly,
  onCategoryChange,
  onOfficialOnlyChange,
}) {
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
        {FEED_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onCategoryChange(cat.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.officialRow}>
        <Pressable
          onPress={() => onOfficialOnlyChange(!officialOnly)}
          style={[styles.chip, styles.chipOfficial, officialOnly && styles.chipActive]}
        >
          <Text style={[styles.chipText, officialOnly && styles.chipTextActive]}>
            Official only
          </Text>
        </Pressable>
      </View>
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
});
