export default {
  expo: {
    name: 'Unofficial Cursor News',
    slug: 'unofficial-cursor-news',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'unofficial-cursor-news',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.pastecraft.unofficialcursornews',
    },
    android: {
      package: 'com.pastecraft.unofficialcursornews',
      usesCleartextTraffic: true,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-dev-client',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#111111',
        },
      ],
    ],
    extra: {
      ...(process.env.EXPO_PUBLIC_API_BASE
        ? { apiBase: process.env.EXPO_PUBLIC_API_BASE }
        : {}),
    },
  },
};
