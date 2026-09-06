import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkInspector, {
  ErrorBoundary,
  connectReduxStore,
  setupNetworkLogger,
  setupConsoleLogger,
  enableNativeCrashProtection,
  BrandSquareIcon,
} from 'react-native-inapp-inspector';

import { mockStore } from './src/store/mockStore';
import { HomeScreen } from './src/screens/HomeScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';

// ⚡ Call BEFORE any component renders so axios.create() is already patched
setupNetworkLogger();
setupConsoleLogger();

// ⚡ Enable Native Kotlin (Android) & iOS Signal/Exception Crash Protection
enableNativeCrashProtection();

// Connect mock store to the inspector
connectReduxStore(mockStore);

import { ScreenCapture } from 'react-native-inapp-inspector/capture';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function App() {
  React.useEffect(() => {
    setTimeout(async () => {
      try {
        console.log('[TEST] Calling ScreenCapture.takeScreenshot...');
        const res = await ScreenCapture.takeScreenshot({ format: 'png', quality: 0.9 });
        console.log('[TEST] ScreenCapture.takeScreenshot result:', JSON.stringify(res));
        const list = await ScreenCapture.getMediaList();
        console.log('[TEST] ScreenCapture.getMediaList:', JSON.stringify(list));
      } catch (err) {
        console.log('[TEST] ScreenCapture error:', err);
      }
    }, 1500);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#F8FAFC',
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
      {/* Render inspector globally outside inner component ErrorBoundary */}
      <NetworkInspector
        navigationRef={navigationRef}
        environment="DEV"
        appIcon={<BrandSquareIcon />}
        initialVisible={true}
        defaultTab="media"
      />
    </SafeAreaProvider>
  );
}

export default App;
