import { StyleSheet, Text, View } from 'react-native';
import { DISCLAIMER } from '../config/constants';

export function DisclaimerBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3cd',
    borderBottomColor: '#ffecb5',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    color: '#664d03',
    fontSize: 12,
    lineHeight: 16,
  },
});
