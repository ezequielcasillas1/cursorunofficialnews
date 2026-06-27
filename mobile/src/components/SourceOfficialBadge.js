import { StyleSheet, Text, View } from 'react-native';

export function SourceOfficialBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>Official</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#e8f4ea',
    borderColor: '#2e7d32',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  text: {
    color: '#2e7d32',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
