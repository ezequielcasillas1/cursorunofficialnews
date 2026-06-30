import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getMobileBmcPageUrl } from '../monetization/config';
import { loadSourcesHidden, saveSourcesHidden } from '../services/sourceVisibilityPrefs';
import { loadTacoUnlocked, saveTacoUnlocked } from '../services/tacoUnlockPrefs';
import {
  TACO_UNLOCK_BODY,
  TACO_UNLOCK_CONFIRM_LABEL,
} from '../../shared/taco-unlock/config';
import { colors, fontFamilies, radii, spacing, typography } from '../theme/tokens';

function TacoUnlockModal({ visible, onClose, onUnlock }) {
  const bmcUrl = getMobileBmcPageUrl();

  async function openBmc() {
    if (!bmcUrl) return;
    await Linking.openURL(bmcUrl);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEmoji}>🌮</Text>
          <Text style={styles.modalTitle}>Buy me a taco</Text>
          <Text style={styles.modalBody}>{TACO_UNLOCK_BODY}</Text>
          {bmcUrl ? (
            <Pressable onPress={openBmc} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Open Buy Me a Coffee</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => {
              onUnlock?.();
              onClose?.();
            }}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>{TACO_UNLOCK_CONFIRM_LABEL}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.textBtn}>
            <Text style={styles.textBtnLabel}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function useSourceVisibility() {
  const [tacoUnlocked, setTacoUnlocked] = useState(false);
  const [sourcesHidden, setSourcesHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadTacoUnlocked(), loadSourcesHidden()]).then(([unlocked, hidden]) => {
      setTacoUnlocked(unlocked);
      setSourcesHidden(hidden);
      setLoaded(true);
    });
  }, []);

  async function hideSources() {
    setSourcesHidden(true);
    await saveSourcesHidden(true);
  }

  async function unlockFeatures() {
    setTacoUnlocked(true);
    setSourcesHidden(false);
    await saveTacoUnlocked(true);
    await saveSourcesHidden(false);
  }

  return {
    tacoUnlocked,
    sourcesHidden,
    loaded,
    hideSources,
    unlockFeatures,
    unlockSources: unlockFeatures,
  };
}

export { TacoUnlockModal };

export function SourceVisibilityControls({ sourcesHidden, onHide, onUnlock }) {
  const [unlockVisible, setUnlockVisible] = useState(false);

  function confirmHide() {
    Alert.alert(
      'Hide source names?',
      "Headlines stay — source labels and the sources list disappear. To peek again, you'll need to buy a taco 🌮",
      [
        { text: 'Keep showing sources', style: 'cancel' },
        { text: 'Hide sources', style: 'destructive', onPress: () => onHide?.() },
      ],
    );
  }

  if (sourcesHidden) {
    return (
      <>
        <View style={styles.row}>
          <Pressable
            onPress={() => setUnlockVisible(true)}
            style={[styles.chip, styles.chipHidden]}
          >
            <Text style={styles.chipTextHidden}>Sources hidden 🌮 Tap to unlock</Text>
          </Pressable>
        </View>
        <TacoUnlockModal
          visible={unlockVisible}
          onClose={() => setUnlockVisible(false)}
          onUnlock={onUnlock}
        />
      </>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={confirmHide} style={[styles.chip, styles.chipHide]}>
        <Text style={styles.chipText}>Hide sources</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.chipBg,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipHide: {
    borderColor: colors.goldMuted,
  },
  chipHidden: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.gold,
  },
  chipText: {
    ...typography.uiLabel,
    color: colors.inkSoft,
  },
  chipTextHidden: {
    ...typography.uiLabel,
    color: colors.navy,
    fontFamily: fontFamilies.uiSemi,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(13, 27, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.cardElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 360,
    padding: spacing.xl,
    width: '100%',
  },
  modalEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalTitle: {
    ...typography.cardTitle,
    fontSize: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  primaryBtnText: {
    ...typography.uiLabel,
    color: colors.chipActiveText,
    fontFamily: fontFamilies.uiSemi,
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    ...typography.uiLabel,
    color: colors.navy,
    fontFamily: fontFamilies.uiSemi,
    textAlign: 'center',
  },
  textBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textBtnLabel: {
    ...typography.uiLabel,
    color: colors.link,
  },
});
