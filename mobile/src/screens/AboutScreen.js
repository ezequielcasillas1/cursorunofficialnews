import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchSources } from '../api/newsClient';
import { DISCLAIMER } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { SourceOfficialBadge } from '../components/SourceOfficialBadge';

export function AboutScreen({ onBack }) {
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourcesError, setSourcesError] = useState('');

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources || []))
      .catch((err) =>
        setSourcesError(err.message || 'Could not load sources from API'),
      )
      .finally(() => setLoadingSources(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <DisclaimerBanner />
      <Pressable onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back to feed</Text>
      </Pressable>
      <Text style={styles.title}>About</Text>
      <Text style={styles.body}>{DISCLAIMER}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <Text style={styles.body}>
          This app aggregates headlines and short excerpts from Cursor-related
          sources. Tap any card to open the original article, release note, forum
          post, or video in your browser. We never republish full article bodies.
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current features</Text>
        <Text style={styles.body}>
          • Official changelog RSS and GitHub releases{'\n'}
          • Forum announcements and blog posts (RSS + optional scrape){'\n'}
          • YouTube channel videos{'\n'}
          • Deduplicated timeline — official source wins on duplicates{'\n'}
          • Category filters: All, Updates, News, Forum, Videos{'\n'}
          • Official-only filter and pull-to-refresh
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sources</Text>
        {loadingSources ? (
          <ActivityIndicator style={styles.loader} />
        ) : sourcesError ? (
          <Text style={styles.error}>{sourcesError}</Text>
        ) : sources.length === 0 ? (
          <Text style={styles.body}>No sources registered.</Text>
        ) : (
          sources.map((source) => (
            <View key={source.id} style={styles.sourceRow}>
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceName}>{source.name}</Text>
                {source.isOfficial ? <SourceOfficialBadge /> : null}
              </View>
              <Text style={styles.sourceMeta}>
                {source.category} · {source.ingestMethod || 'rss'}
                {source.enabled ? '' : ' · disabled'}
              </Text>
              {source.attributionLabel ? (
                <Text style={styles.sourceMeta}>
                  Attribution: {source.attributionLabel}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming later</Text>
        <Text style={styles.body}>
          Push notifications for new items (opt-in), optional membership for
          extras, and a public web/PWA build. Core news feed stays free.
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
  loader: {
    marginTop: 8,
  },
  error: {
    color: '#b00020',
    fontSize: 14,
  },
  sourceRow: {
    borderColor: '#ddd',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  sourceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  sourceName: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
  sourceMeta: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
});
