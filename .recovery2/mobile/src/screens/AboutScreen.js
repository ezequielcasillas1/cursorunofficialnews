import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISCLAIMER } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export function AboutScreen({ onBack }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <DisclaimerBanner />
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back to feed</Text>
      </Pressable>
      <Text style={styles.title}>About</Text>
      <Text style={styles.body}>{DISCLAIMER}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phase 1</Text>
        <Text style={styles.body}>
          Official feeds only: Cursor changelog RSS and GitHub releases. Tap any
          headline to open the original source in your browser.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planned</Text>
        <Text style={styles.body}>
          Aggregators, notifications, and optional membership — not in this
          build.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.body}>Privacy policy URL — coming soon.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  back: {
    marginBottom: 12,
    marginTop: 12,
  },
  backText: {
    color: '#0066cc',
    fontSize: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
});
