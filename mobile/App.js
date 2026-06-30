import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { FeedScreen } from './src/screens/FeedScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { NotificationSettingsScreen } from './src/screens/NotificationSettingsScreen';
import { PUSH_ENABLED } from './src/config/push';
import { useAppFonts } from './src/theme/fonts';
import { colors } from './src/theme/tokens';

export default function App() {
  const [screen, setScreen] = useState('feed');
  const [aboutScrollToSources, setAboutScrollToSources] = useState(false);
  const { loaded: fontsLoaded, error: fontError } = useAppFonts();

  useEffect(() => {
    if (!PUSH_ENABLED) return undefined;

    let subscription = null;
    let cancelled = false;

    import('./src/services/pushNotifications').then(({ addNotificationResponseListener, openNotificationUrl }) => {
      addNotificationResponseListener(openNotificationUrl).then((sub) => {
        if (cancelled) {
          sub.remove();
          return;
        }
        subscription = sub;
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  function handleOpenAbout({ scrollToSources = false } = {}) {
    setAboutScrollToSources(scrollToSources);
    setScreen('about');
  }

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
      {screen === 'about' ? (
        <AboutScreen
          onBack={() => {
            setAboutScrollToSources(false);
            setScreen('feed');
          }}
          scrollToSources={aboutScrollToSources}
        />
      ) : screen === 'alerts' ? (
        <NotificationSettingsScreen onBack={() => setScreen('feed')} />
      ) : (
        <FeedScreen
          onOpenAbout={handleOpenAbout}
          onOpenAlerts={() => setScreen('alerts')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  boot: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
});
