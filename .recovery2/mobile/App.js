import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { FeedScreen } from './src/screens/FeedScreen';
import { AboutScreen } from './src/screens/AboutScreen';

export default function App() {
  const [screen, setScreen] = useState('feed');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {screen === 'about' ? (
        <AboutScreen onBack={() => setScreen('feed')} />
      ) : (
        <FeedScreen onOpenAbout={() => setScreen('about')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
});
