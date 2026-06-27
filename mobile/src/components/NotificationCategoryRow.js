import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme/tokens';



export function NotificationCategoryRow({ category, enabled, onToggle, disabled = false }) {
  return (
    <Pressable
      onPress={() => !disabled && onToggle(category.id)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.rowDisabled,
        pressed && !disabled && styles.rowPressed,
      ]}
    >

      <View style={styles.textBlock}>

        <Text style={styles.label}>{category.label}</Text>

        <Text style={styles.description}>{category.description}</Text>

      </View>

      <Switch
        value={enabled}
        onValueChange={() => onToggle(category.id)}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.navySoft }}
        thumbColor={enabled ? colors.gold : colors.accentSoft}
      />

    </Pressable>

  );

}



const styles = StyleSheet.create({

  row: {

    alignItems: 'center',

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

    maxWidth: '78%',

  },

  label: {

    ...typography.cardTitle,

    fontSize: 15,

    marginBottom: 2,

  },

  description: {

    ...typography.bodySmall,

  },

});

