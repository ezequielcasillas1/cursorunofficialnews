import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { fetchSources } from '../api/newsClient';
import { DISCLAIMER } from '../config/constants';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { EditorialDivider } from '../components/EditorialDivider';
import { SourceOfficialBadge } from '../components/SourceOfficialBadge';
import {
  SourceVisibilityControls,
  TacoUnlockModal,
  useSourceVisibility,
} from '../components/SourceVisibilityControls';
import { TACO_SOURCES_HIDDEN_TEASER } from '../../shared/taco-unlock/config';
import { colors, radii, spacing, typography } from '../theme/tokens';

export function AboutScreen({ onBack, scrollToSources = false }) {
  const scrollRef = useRef(null);
  const sourcesOffsetY = useRef(0);
  const [sources, setSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [sourcesError, setSourcesError] = useState('');
  const { sourcesHidden, hideSources, unlockFeatures } = useSourceVisibility();
  const [unlockVisible, setUnlockVisible] = useState(false);

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources || []))
      .catch((err) =>
        setSourcesError(err.message || 'Could not load sources from API'),
      )
      .finally(() => setLoadingSources(false));
  }, []);

  useEffect(() => {
    if (!scrollToSources || sourcesHidden || loadingSources) return undefined;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, sourcesOffsetY.current - spacing.lg),
        animated: true,
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [scrollToSources, sourcesHidden, loadingSources]);

  return (
    <ScrollView ref={scrollRef} style={styles.root} contentContainerStyle={styles.container}>
      <DisclaimerBanner />
      <Pressable onPress={onBack} style={styles.back}>
        <ArrowLeft size={18} color={colors.link} strokeWidth={2} />
        <Text style={styles.backText}>Back to feed</Text>
      </Pressable>

      <Text style={styles.eyebrow}>About this edition</Text>
      <Text style={styles.title}>Unofficial Cursor News</Text>
      <EditorialDivider style={styles.divider} />
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
          • Tutorials from Cursor Learn, community guides (RSS, sitemap + scrape){'\n'}
          • YouTube channel videos{'\n'}
          • Deduplicated timeline — official source wins on duplicates{'\n'}
          • Category filters: All, Updates, News, Forum, Videos, Tutorials{'\n'}
          • Official-only filter and pull-to-refresh{'\n'}
          • Opt-in digest alerts (Settings → Alerts)
        </Text>
      </View>

      <View
        style={styles.section}
        onLayout={(event) => {
          sourcesOffsetY.current = event.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.sectionTitle}>Sources</Text>
        {sourcesHidden ? (
          <>
            <Text style={styles.body}>{TACO_SOURCES_HIDDEN_TEASER}</Text>
            <Pressable
              onPress={() => setUnlockVisible(true)}
              style={styles.unlockChip}
            >
              <Text style={styles.unlockChipText}>Unlock sources</Text>
            </Pressable>
            <TacoUnlockModal
              visible={unlockVisible}
              onClose={() => setUnlockVisible(false)}
              onUnlock={unlockFeatures}
            />
          </>
        ) : (
          <>
            <SourceVisibilityControls sourcesHidden={false} onHide={hideSources} />
            {loadingSources ? (
              <ActivityIndicator color={colors.navy} style={styles.loader} />
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
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coming later</Text>
        <Text style={styles.body}>
          Instant alert delivery and optional membership extras. Public web/PWA
          build. Core news feed stays free.
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
  root: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  container: {
    paddingBottom: spacing.xxxl,
  },
  back: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backText: {
    ...typography.uiLabel,
    color: colors.link,
    fontSize: 15,
  },
  eyebrow: {
    ...typography.eyebrow,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    marginHorizontal: spacing.lg,
  },
  body: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.cardTitle,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  loader: {
    marginTop: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
  },
  sourceRow: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sourceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sourceName: {
    ...typography.cardTitle,
    fontSize: 15,
  },
  sourceMeta: {
    ...typography.meta,
    lineHeight: 18,
  },
  unlockChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  unlockChipText: {
    ...typography.uiLabel,
    color: colors.navy,
  },
});
