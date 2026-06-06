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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetworkInspector from 'react-native-inapp-inspector';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.container}>
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
          </View>
        </ScrollView>

        {/* Floating In-App Debug Inspector */}
        <NetworkInspector />
      </SafeAreaView>
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
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default App;
