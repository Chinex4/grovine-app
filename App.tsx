import React from 'react';
import "./src/styles/global.css";
import { RootNavigator } from './src/navigation/RootNavigator';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './src/store';

SplashScreen.preventAutoHideAsync();

import Toast from 'react-native-toast-message';

const queryClient = new QueryClient();

export default function App() {
  const [loaded, error] = useFonts({
    // Uncomment these when you add the font files to assets/fonts/
    // 'Satoshi': require('./assets/fonts/Satoshi-Regular.otf'),
    // 'Satoshi-Bold': require('./assets/fonts/Satoshi-Bold.otf'),
    // 'Satoshi-Black': require('./assets/fonts/Satoshi-Black.otf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
          <Toast />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
