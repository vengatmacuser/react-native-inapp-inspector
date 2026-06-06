import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkInspector from 'react-native-inapp-inspector';

function HomeScreen({ navigation }: any) {
  const triggerNetworkRequest = async () => {
    try {
      console.log('[API] Triggering network request...');
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const data = await response.json();
      console.log('[API] Network request succeeded:', data);
    } catch (error) {
      console.error('[API] Network request failed:', error);
    }
  };

  const triggerFailedNetworkRequest = async () => {
    try {
      console.log('[API] Triggering failing network request...');
      await fetch('https://jsonplaceholder.typicode.com/invalid-url-404');
    } catch (error) {
      console.error('[API] Network request failed:', error);
    }
  };

  const triggerConsoleLogs = () => {
    console.log('[App] Normal log triggered at ' + new Date().toLocaleTimeString());
    console.warn('[App] Warning log triggered. Something might be off!');
    console.error('[App] Error log triggered! Simulated critical error.');
  };

  React.useEffect(() => {
    console.log('[Test] HomeScreen mounted, triggering automated tests...');
    triggerNetworkRequest();
    triggerConsoleLogs();
    
    const timer = setTimeout(() => {
      console.log('[Test] Navigating to Details screen...');
      navigation.navigate('Details');
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>RN In-App Inspector</Text>
        <Text style={styles.subtitle}>Reference Implementation</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inspect Network & Console Logs</Text>
          <Text style={styles.cardDesc}>
            Tap the buttons below to trigger simulated background events, then click the floating inspector badge to open the inspector overlay.
          </Text>

          <TouchableOpacity style={styles.button} onPress={triggerNetworkRequest}>
            <Text style={styles.buttonText}>Trigger Fetch (200 OK)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={triggerFailedNetworkRequest}>
            <Text style={styles.buttonText}>Trigger Fetch (404 Error)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={triggerConsoleLogs}>
            <Text style={styles.buttonText}>Trigger Console Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={() => navigation.navigate('Details')}>
            <Text style={styles.buttonText}>Go to Details Screen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <NetworkInspector />
    </View>
  );
}

function DetailsScreen({ navigation }: any) {
  const triggerDetailLogs = () => {
    console.log('[Details] User navigated to details screen and triggered a log.');
  };

  React.useEffect(() => {
    console.log('[Test] DetailsScreen mounted!');
    triggerDetailLogs();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Details Screen</Text>
        <Text style={styles.subtitle}>Navigation State Verification</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify Navigation Routing</Text>
          <Text style={styles.cardDesc}>
            The inspector tracks your current navigation route. Open the inspector overlay and check the 'route' metadata on new network/console logs.
          </Text>

          <TouchableOpacity style={styles.button} onPress={triggerDetailLogs}>
            <Text style={styles.buttonText}>Trigger Log from Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <NetworkInspector />
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1E1E24',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#121214',
            },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="Details" component={DetailsScreen} options={{ title: 'Details' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#AEAEB2',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  infoButton: {
    backgroundColor: '#5856D6',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default App;
