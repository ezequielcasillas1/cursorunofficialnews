import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  DEFAULT_CATEGORY_ITEM_LIMIT,
  MAX_CATEGORY_ITEM_LIMIT,
  MIN_CATEGORY_ITEM_LIMIT,
} from '../../shared/notifications/category-limits.js';
import { colors, radii, spacing, typography } from '../theme/tokens';

const LIMIT_OPTIONS = Array.from(
  { length: MAX_CATEGORY_ITEM_LIMIT - MIN_CATEGORY_ITEM_LIMIT + 1 },
  (_, index) => MIN_CATEGORY_ITEM_LIMIT + index,
);

export function EmailCategoryLimitRow({
  category,
  enabled,
  limit = DEFAULT_CATEGORY_ITEM_LIMIT,
  onToggle,
  onLimitChange,
  disabled = false,
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Pressable
        onPress={() => !disabled && onToggle(category.id)}
        disabled={disabled}
        style={({ pressed }) => [styles.textBlock, pressed && !disabled && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${category.label} topic`}
      >
        <Text style={styles.label}>{category.label}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </Pressable>

      <View style={styles.controls}>
        {enabled ? (
          <View style={styles.limitGroup} accessibilityRole="adjustable">
            <Text style={styles.limitLabel}>Per digest</Text>
            <View style={styles.limitButtons}>
              {LIMIT_OPTIONS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => !disabled && onLimitChange(category.id, value)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.limitButton,
                    limit === value && styles.limitButtonActive,
                    pressed && !disabled && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: limit === value }}
                  accessibilityLabel={`${value} headline${value === 1 ? '' : 's'} for ${category.label}`}
                >
                  <Text
                    style={[
                      styles.limitButtonText,
                      limit === value && styles.limitButtonTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Switch
          value={enabled}
          onValueChange={() => onToggle(category.id)}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.navySoft }}
          thumbColor={enabled ? colors.gold : colors.accentSoft}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  textBlock: {
    flex: 1,
    marginRight: spacing.md,
    maxWidth: '58%',
  },
  label: {
    ...typography.cardTitle,
    fontSize: 15,
    marginBottom: 2,
  },
  description: {
    ...typography.bodySmall,
  },
  controls: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  limitGroup: {
    alignItems: 'flex-end',
  },
  limitLabel: {
    ...typography.meta,
    marginBottom: spacing.xs,
  },
  limitButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  limitButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.borderStrong,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  limitButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  limitButtonText: {
    ...typography.uiLabel,
    color: colors.inkSoft,
    fontSize: 12,
  },
  limitButtonTextActive: {
    color: colors.chipActiveText,
  },
});
