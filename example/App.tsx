import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkInspector, {
  ErrorBoundary,
  connectReduxStore,
  setupNetworkLogger,
  setupConsoleLogger,
  enableNativeCrashProtection,
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

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

function App() {
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
      <NetworkInspector navigationRef={navigationRef} environment="DEV" />
    </SafeAreaProvider>
  );
}

export default App;
