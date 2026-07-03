import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ArrowLeft, Mail, Send } from 'lucide-react-native';

import { NOTIFICATION_CATEGORIES, NEWSLETTER_OFFICIAL_ONLY } from '../config/notifications';

import { PUSH_ENABLED, PUSH_REBUILD_HINT } from '../config/push';

import { EditorialDivider } from '../components/EditorialDivider';

import { EmailCategoryLimitRow } from '../components/EmailCategoryLimitRow';

import { NotificationCategoryRow } from '../components/NotificationCategoryRow';

import { NotificationPreviewCard } from '../components/NotificationPreviewCard';

import {
  loadEmailPrefs,
  saveEmailPrefs,
  subscribeEmail,
  unsubscribeEmail,
  isValidEmailFormat,
  toggleEmailCategory,
  setEmailCategoryLimit,
  loadMembershipToken,
  saveMembershipToken,
} from '../services/emailNewsletter';

import { getMobileMembershipUrl } from '../monetization/config';

import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  toggleCategory,
} from '../services/notificationPrefs';

import {
  scheduleLocalPreviewNotification,
  syncDeviceRegistration,
} from '../services/pushNotifications';

import { colors, radii, spacing, typography } from '../theme/tokens';

export function NotificationSettingsScreen({ onBack, previewItem }) {
  const [prefs, setPrefs] = useState(null);
  const [emailPrefs, setEmailPrefs] = useState(null);
  const [status, setStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [emailSyncing, setEmailSyncing] = useState(false);
  const [membershipToken, setMembershipToken] = useState('');
  const [membershipTokenDraft, setMembershipTokenDraft] = useState('');

  useEffect(() => {
    Promise.all([loadNotificationPrefs(), loadEmailPrefs(), loadMembershipToken()]).then(
      ([push, email, token]) => {
        setPrefs(push);
        setEmailPrefs(email);
        setMembershipToken(token);
        setMembershipTokenDraft(token);
      },
    );
  }, []);

  function handleOpenMembershipPage() {
    Linking.openURL(getMobileMembershipUrl()).catch(() => {});
  }

  async function handleSaveMembershipToken() {
    const trimmed = membershipTokenDraft.trim();
    await saveMembershipToken(trimmed);
    setMembershipToken(trimmed);
    setEmailStatus(trimmed ? 'Membership token saved on this device.' : 'Membership token cleared.');
    setEmailError('');
  }

  async function persist(nextPrefs) {
    setPrefs(nextPrefs);
    setError('');
    setSyncing(true);

    try {
      await saveNotificationPrefs(nextPrefs);
      const result = await syncDeviceRegistration(nextPrefs);

      if (nextPrefs.enabled && !result.ok) {
        setError(result.reason || 'Could not register for push alerts.');
      } else if (nextPrefs.enabled && result.ok) {
        setStatus('Alerts enabled — you will receive a digest when new items arrive.');
      } else {
        setStatus('Alerts paused.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save notification settings.');
    } finally {
      setSyncing(false);
    }
  }

  function handleMasterToggle(enabled) {
    if (!prefs) return;
    persist({ ...prefs, enabled });
  }

  function handleCategoryToggle(categoryId) {
    if (!prefs) return;
    const categories = toggleCategory(prefs.categories, categoryId);
    persist({ ...prefs, categories });
  }

  async function handlePreviewTap() {
    const sample = previewItem || {
      category: 'changelog',
      sourceName: 'Cursor Changelog',
      title: 'Sample: new changelog entry',
      canonicalUrl: 'https://cursor.com/changelog',
    };

    try {
      await scheduleLocalPreviewNotification({
        ...sample,
        categoryLabel: sample.category,
      });
      setStatus('Preview notification sent — check your tray.');
    } catch (err) {
      setError(err.message || 'Preview failed. Use a physical device.');
    }
  }

  async function syncEmailToServer(prefs) {
    if (!membershipToken) {
      throw new Error(
        'An active membership is required to unlock the email newsletter. Join on the website, then paste your membership token below.',
      );
    }
    if (!isValidEmailFormat(prefs.email)) {
      throw new Error('Enter a valid email address.');
    }
    const categories = prefs.enabled ? prefs.categories : [];
    if (prefs.enabled && categories.length === 0) {
      throw new Error('Select at least one topic for email digest.');
    }
    const response = await subscribeEmail({
      categories,
      categoryLimits: prefs.enabled ? prefs.categoryLimits : {},
      officialOnly: prefs.officialOnly,
      enabled: prefs.enabled,
      resendVerification: prefs.pendingVerification,
      membershipToken,
    });
    if (response?.pending) {
      return {
        ...prefs,
        enabled: false,
        pendingVerification: true,
        manageToken: '',
      };
    }
    return {
      ...prefs,
      email: response?.subscriber?.email || prefs.email,
      categoryLimits: response?.subscriber?.categoryLimits || prefs.categoryLimits,
      officialOnly:
        typeof response?.subscriber?.officialOnly === 'boolean'
          ? response.subscriber.officialOnly
          : prefs.officialOnly,
      manageToken: response?.subscriber?.manageToken || prefs.manageToken || '',
      pendingVerification: false,
    };
  }

  async function persistEmail(nextEmailPrefs, { syncServer = false, unsubscribe = false } = {}) {
    setEmailPrefs(nextEmailPrefs);
    setEmailError('');
    setEmailSyncing(true);

    try {
      await saveEmailPrefs(nextEmailPrefs);

      if (unsubscribe) {
        if (!nextEmailPrefs.manageToken) {
          throw new Error(
            'Could not update settings on this device. Tap Subscribe again, or use the Unsubscribe link in any digest email you have received.',
          );
        }
        await unsubscribeEmail(nextEmailPrefs.manageToken);
        const cleared = {
          ...nextEmailPrefs,
          enabled: false,
          manageToken: '',
          pendingVerification: false,
        };
        await saveEmailPrefs(cleared);
        setEmailPrefs(cleared);
        setEmailStatus('Unsubscribed — no more digest emails.');
        return;
      }

      if (syncServer) {
        const syncedPrefs = await syncEmailToServer(nextEmailPrefs);
        await saveEmailPrefs(syncedPrefs);
        setEmailPrefs(syncedPrefs);
        setEmailStatus(
          syncedPrefs.pendingVerification
            ? 'Check your email to confirm your subscription.'
            : nextEmailPrefs.enabled
              ? 'Subscribed — one digest email when new headlines arrive.'
              : 'Email digest paused.',
        );
      } else if (!nextEmailPrefs.enabled) {
        setEmailStatus('Email digest paused.');
      }
    } catch (err) {
      setEmailError(err.message || 'Failed to save email settings.');
    } finally {
      setEmailSyncing(false);
    }
  }

  function handleEmailMasterToggle(enabled) {
    if (!emailPrefs) return;
    const next = { ...emailPrefs, enabled };
    persistEmail(next, {
      syncServer: isValidEmailFormat(next.email),
    });
  }

  function handleEmailCategoryToggle(categoryId) {
    if (!emailPrefs) return;
    const { categories, categoryLimits } = toggleEmailCategory(
      emailPrefs.categories,
      categoryId,
      emailPrefs.categoryLimits,
    );
    const next = { ...emailPrefs, categories, categoryLimits };
    persistEmail(next, {
      syncServer: next.enabled && isValidEmailFormat(next.email),
    });
  }

  function handleEmailCategoryLimit(categoryId, value) {
    if (!emailPrefs) return;
    const categoryLimits = setEmailCategoryLimit(
      emailPrefs.categoryLimits,
      emailPrefs.categories,
      categoryId,
      value,
    );
    const next = { ...emailPrefs, categoryLimits };
    persistEmail(next, {
      syncServer: next.enabled && isValidEmailFormat(next.email),
    });
  }

  function handleEmailOfficialOnlyToggle(officialOnly) {
    if (!emailPrefs) return;
    const next = { ...emailPrefs, officialOnly };
    persistEmail(next);
  }

  function handleEmailChange(text) {
    if (!emailPrefs) return;
    setEmailPrefs({ ...emailPrefs, email: text });
  }

  function handleSubscribePress() {
    if (!emailPrefs) return;
    persistEmail({ ...emailPrefs, enabled: true }, { syncServer: true });
  }

  function handleUnsubscribePress() {
    if (!emailPrefs) return;
    persistEmail(emailPrefs, { unsubscribe: true });
  }

  if (!prefs || !emailPrefs) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  const previewSample =
    previewItem ||
    (prefs.categories.length
      ? {
          category: prefs.categories[0],
          sourceName: 'Cursor News',
          title: 'Headlines from your selected topics appear like this.',
          excerpt: 'Short title only — tap opens the original source.',
        }
      : null);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack} style={styles.back}>
        <ArrowLeft size={18} color={colors.link} strokeWidth={2} />
        <Text style={styles.backText}>Back to feed</Text>
      </Pressable>

      <Text style={styles.eyebrow}>Unofficial · Independent</Text>
      <Text style={styles.headline}>Alerts</Text>
      <EditorialDivider />
      <Text style={styles.subhead}>
        Opt-in digest when new Cursor headlines land. Tap any alert to open the
        original article — never full republished text.
      </Text>

      {!PUSH_ENABLED ? (
        <View style={styles.rebuildBanner}>
          <Text style={styles.rebuildBannerText}>{PUSH_REBUILD_HINT}</Text>
        </View>
      ) : null}

      <View style={styles.masterRow}>
        <View style={styles.masterText}>
          <Text style={styles.masterLabel}>Enable alerts</Text>
          <Text style={styles.masterHint}>
            {prefs.enabled ? 'Digest mode · Free tier' : 'Off — no pushes sent'}
          </Text>
        </View>
        <Switch
          value={prefs.enabled}
          onValueChange={handleMasterToggle}
          disabled={syncing}
          trackColor={{ false: colors.border, true: colors.navySoft }}
          thumbColor={prefs.enabled ? colors.gold : colors.accentSoft}
        />
      </View>

      {syncing ? <ActivityIndicator style={styles.syncSpinner} size="small" color={colors.navy} /> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Preview</Text>
      <NotificationPreviewCard item={previewSample} />
      <Pressable onPress={handlePreviewTap} style={styles.previewButton}>
        <Send size={14} color={colors.link} strokeWidth={2} />
        <Text style={styles.previewButtonText}>Send test notification</Text>
      </Pressable>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Push topics</Text>
      {NOTIFICATION_CATEGORIES.map((cat) => (
        <NotificationCategoryRow
          key={cat.id}
          category={cat}
          enabled={prefs.categories.includes(cat.id)}
          onToggle={handleCategoryToggle}
        />
      ))}

      <EditorialDivider style={styles.emailDivider} />

      <View style={styles.emailHeader}>
        <Mail size={18} color={colors.navy} strokeWidth={2} />
        <Text style={styles.emailHeadline}>Email digest</Text>
      </View>
      <Text style={styles.emailSubhead}>
        Opt in to a newsletter-style email when new headlines match your topics.
        One digest per update cycle — not one email per item.
      </Text>

      <View style={styles.membershipCard}>
        <Text style={styles.masterLabel}>Membership required</Text>
        <Text style={styles.membershipHint}>
          The email newsletter is a $1–$5/mo membership benefit. Join or manage your membership on the
          website, then paste your membership token below to unlock the newsletter on this device.
          Ad-free browsing on the website is coming soon once AdSense is enabled.
        </Text>
        <Pressable onPress={handleOpenMembershipPage} style={styles.previewButton}>
          <Text style={styles.previewButtonText}>Open membership page</Text>
        </Pressable>
        <TextInput
          style={styles.emailInput}
          value={membershipTokenDraft}
          onChangeText={setMembershipTokenDraft}
          placeholder="Paste membership token"
          placeholderTextColor={colors.inkLight}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={handleSaveMembershipToken} style={styles.emailButtonOutline}>
          <Text style={styles.emailButtonOutlineText}>
            {membershipToken ? 'Update token' : 'Save token'}
          </Text>
        </Pressable>
        {membershipToken ? (
          <Text style={styles.membershipStatusText}>Membership token saved on this device.</Text>
        ) : null}
      </View>

      <Text style={[styles.sectionLabel, styles.emailFieldLabel]}>Email address</Text>
      <TextInput
        style={styles.emailInput}
        value={emailPrefs.email}
        onChangeText={handleEmailChange}
        placeholder="you@example.com"
        placeholderTextColor={colors.inkLight}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!emailSyncing}
      />

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Email topics</Text>
      <Text style={styles.emailTopicsHint}>
        Choose which categories trigger a digest. For each topic, pick 1–3 headlines
        to include per email.
      </Text>
      {NOTIFICATION_CATEGORIES.map((cat) => (
        <EmailCategoryLimitRow
          key={`email-${cat.id}`}
          category={cat}
          enabled={emailPrefs.categories.includes(cat.id)}
          limit={emailPrefs.categoryLimits?.[cat.id] ?? 1}
          onToggle={handleEmailCategoryToggle}
          onLimitChange={handleEmailCategoryLimit}
          disabled={emailSyncing}
        />
      ))}

      <View style={styles.officialOnlyRow}>
        <View style={styles.officialOnlyCopy}>
          <Text style={styles.masterLabel}>{NEWSLETTER_OFFICIAL_ONLY.label}</Text>
          <Text style={styles.emailTopicsHint}>{NEWSLETTER_OFFICIAL_ONLY.description}</Text>
        </View>
        <Switch
          value={Boolean(emailPrefs.officialOnly)}
          onValueChange={handleEmailOfficialOnlyToggle}
          disabled={emailSyncing}
          trackColor={{ false: colors.border, true: colors.navySoft }}
          thumbColor={emailPrefs.officialOnly ? colors.gold : colors.accentSoft}
        />
      </View>

      <View style={styles.masterRow}>
        <View style={styles.masterText}>
          <Text style={styles.masterLabel}>Enable email digest</Text>
          <Text style={styles.masterHint}>
            {emailPrefs.pendingVerification
              ? 'Waiting for email confirmation'
              : emailPrefs.enabled
                ? 'Subscribed · Digest mode'
                : 'Off — no emails sent'}
          </Text>
        </View>
        <Switch
          value={emailPrefs.enabled}
          onValueChange={handleEmailMasterToggle}
          disabled={emailSyncing}
          trackColor={{ false: colors.border, true: colors.navySoft }}
          thumbColor={emailPrefs.enabled ? colors.gold : colors.accentSoft}
        />
      </View>

      {emailPrefs.pendingVerification ? (
        <View style={styles.emailPendingBanner}>
          <Text style={styles.emailPendingBannerText}>
            We sent a confirmation link to {emailPrefs.email}. Open that email and tap
            Confirm subscription to finish signing up. Digests start only after you confirm.
          </Text>
        </View>
      ) : null}

      {emailSyncing ? (
        <ActivityIndicator style={styles.syncSpinner} size="small" color={colors.navy} />
      ) : null}
      {emailStatus ? <Text style={styles.status}>{emailStatus}</Text> : null}
      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

      <View style={styles.emailActions}>
        <Pressable
          onPress={handleSubscribePress}
          disabled={emailSyncing}
          style={({ pressed }) => [styles.emailButton, pressed && styles.emailButtonPressed]}
        >
          <Text style={styles.emailButtonText}>Subscribe</Text>
        </Pressable>
        <Pressable
          onPress={handleUnsubscribePress}
          disabled={emailSyncing}
          style={({ pressed }) => [
            styles.emailButtonOutline,
            pressed && styles.emailButtonPressed,
          ]}
        >
          <Text style={styles.emailButtonOutlineText}>Unsubscribe</Text>
        </Pressable>
      </View>

      <View style={styles.emailDisclaimer}>
        <Text style={styles.footerText}>
          Unofficial fan app — not affiliated with Anysphere or Cursor. Your email is
          used only for this digest. Unsubscribe anytime here or from the secure
          link included in each digest email.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Unofficial fan project — not affiliated with Anysphere or Cursor. You
          can mute alerts anytime. Instant delivery may be a paid extra later.
        </Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
  back: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.uiLabel,
    color: colors.link,
    fontSize: 15,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.xs,
  },
  headline: {
    ...typography.headline,
    marginBottom: spacing.sm,
  },
  subhead: {
    ...typography.subhead,
    marginBottom: spacing.xl,
    maxWidth: 520,
  },
  rebuildBanner: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  rebuildBannerText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  masterRow: {
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  masterText: {
    flex: 1,
    marginRight: spacing.md,
  },
  masterLabel: {
    ...typography.cardTitle,
    fontSize: 16,
    marginBottom: 2,
  },
  masterHint: {
    ...typography.meta,
  },
  syncSpinner: {
    marginBottom: spacing.sm,
  },
  status: {
    ...typography.bodySmall,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.sectionLabel,
  },
  sectionSpacing: {
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  previewButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewButtonText: {
    ...typography.uiLabel,
    color: colors.link,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  emailDivider: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  membershipCard: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  membershipHint: {
    ...typography.bodySmall,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  membershipStatusText: {
    ...typography.bodySmall,
    color: colors.success,
  },
  emailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emailHeadline: {
    ...typography.headline,
    fontSize: 22,
    lineHeight: 28,
  },
  emailSubhead: {
    ...typography.subhead,
    fontSize: 15,
    marginBottom: spacing.lg,
    maxWidth: 520,
  },
  emailFieldLabel: {
    marginBottom: spacing.sm,
  },
  emailTopicsHint: {
    ...typography.bodySmall,
    color: colors.inkSoft,
    marginBottom: spacing.md,
    maxWidth: 520,
  },
  officialOnlyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  officialOnlyCopy: {
    flex: 1,
    maxWidth: 520,
  },
  emailInput: {
    ...typography.body,
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emailActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  emailButton: {
    backgroundColor: colors.navy,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emailButtonOutline: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emailButtonPressed: {
    opacity: 0.85,
  },
  emailButtonText: {
    ...typography.uiButton,
    color: colors.chipActiveText,
  },
  emailButtonOutlineText: {
    ...typography.uiButton,
    color: colors.inkSoft,
    textTransform: 'none',
  },
  emailPendingBanner: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  emailPendingBannerText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  emailDisclaimer: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
});
