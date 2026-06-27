import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FEED_CATEGORIES } from '../config/constants';

export function FeedCategoryFilter({
  selectedCategory,
  officialOnly,
  onCategoryChange,
  onOfficialOnlyChange,
}) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
        <Pressable
          onPress={() => onOfficialOnlyChange(!officialOnly)}
          style={[styles.chip, styles.officialChip, officialOnly && styles.chipActive]}
        >
          <Text style={[styles.chipText, officialOnly && styles.chipTextActive]}>
            Official only
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  officialChip: {
    marginLeft: 4,
  },
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
