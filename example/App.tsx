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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetworkInspector, {
  WebView,
  ErrorBoundary,
  connectReduxStore,
  subscribeNetworkLogs,
  subscribeConsoleLogs,
  logAnalyticsEvent,
  subscribeAnalyticsEvents,
} from 'react-native-inapp-inspector';
import axios from 'axios';

// ─── Mock Redux Store ────────────────────────────────────────────────────────
const mockStore = {
  state: {
    auth: {
      user: { id: 101, name: 'Venkatesh', role: 'Lead Architect' },
      token: 'bearer-jwt-tok_5548b366d86',
      isAuthenticated: true,
      lastLogin: new Date().toLocaleTimeString(),
    },
    settings: {
      theme: 'dark',
      notifications: true,
      fontSize: 14,
      locales: ['en-US', 'ta-IN'],
    },
    ui: {
      sidebarOpen: false,
      activeModal: null,
      loadingStates: {
        fetchUser: false,
        updateSettings: false,
      },
    },
  },
  listeners: new Set<() => void>(),
  getState() {
    return this.state;
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
  dispatch(action: any) {
    console.log('[Mock Redux] Dispatching action:', action);
    if (action.type === 'TOGGLE_SIDEBAR') {
      this.state = {
        ...this.state,
        ui: {
          ...this.state.ui,
          sidebarOpen: !this.state.ui.sidebarOpen,
        },
      };
    } else if (action.type === 'SET_THEME') {
      this.state = {
        ...this.state,
        settings: {
          ...this.state.settings,
          theme: action.payload,
        },
      };
    } else if (action.type === 'UPDATE_USER_TIME') {
      this.state = {
        ...this.state,
        auth: {
          ...this.state.auth,
          lastLogin: new Date().toLocaleTimeString(),
        },
      };
    }
    this.listeners.forEach(l => l());
  },
};

// Connect mock store to the inspector
connectReduxStore(mockStore);

function BuggyComponent({ type }: { type: 'js' | 'native' }) {
  if (type === 'js') {
    throw new Error('Simulated JavaScript Crash: ReferenceError: x is not defined in App.tsx at line 67');
  }
  if (type === 'native') {
    throw new Error('Simulated Native Crash: fatal error: Index out of range in Native Swift/Java module at line 70');
  }
  return null;
}

function HomeScreen({ navigation }: any) {
  const [activeCrash, setActiveCrash] = React.useState<'none' | 'js' | 'native'>('none');
  const [apiCount, setApiCount] = React.useState(0);
  const [logCount, setLogCount] = React.useState(0);
  const [analyticsCount, setAnalyticsCount] = React.useState(0);
  const [reduxState, setReduxState] = React.useState(mockStore.getState());

  React.useEffect(() => {
    // Subscribe to logs to display live dashboard counters
    const unsubNet = subscribeNetworkLogs(logs => setApiCount(logs.length));
    const unsubConsole = subscribeConsoleLogs(logs => setLogCount(logs.length));
    const unsubAnalytics = subscribeAnalyticsEvents(events => setAnalyticsCount(events.length));
    const unsubRedux = mockStore.subscribe(() => setReduxState(mockStore.getState()));

    // Initial Logs to populate stats
    console.log('[App] HomeScreen mounted and ready.');
    console.warn('[App] Check the Redux tab to inspect the connected state!');

    return () => {
      unsubNet();
      unsubConsole();
      unsubAnalytics();
      unsubRedux();
    };
  }, []);

  // Create an Axios instance to test automatic interception of custom instances.
  // Note: No manual addAxiosInterceptors call is performed! It is now automatic.
  const axiosClient = React.useMemo(() => axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
  }), []);

  const triggerAxiosGet = async () => {
    try {
      console.log('[Axios] Triggering GET...');
      const response = await axiosClient.get('/posts/1');
      console.log('[Axios] GET response data title:', response.data.title);
    } catch (error: any) {
      console.error('[Axios] GET failed:', error.message);
    }
  };

  const triggerAxiosPost = async () => {
    try {
      console.log('[Axios] Triggering POST...');
      const response = await axiosClient.post('/posts', {
        title: 'New Post via Axios',
        body: 'This is a test post body sent via Axios auto-intercept.',
        userId: 1,
      });
      console.log('[Axios] POST response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] POST failed:', error.message);
    }
  };

  const triggerAxiosPut = async () => {
    try {
      console.log('[Axios] Triggering PUT...');
      const response = await axiosClient.put('/posts/1', {
        id: 1,
        title: 'Updated Title via Axios',
        body: 'This is updated post body content sent via Axios.',
        userId: 1,
      });
      console.log('[Axios] PUT response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] PUT failed:', error.message);
    }
  };

  const triggerAxiosPatch = async () => {
    try {
      console.log('[Axios] Triggering PATCH...');
      const response = await axiosClient.patch('/posts/1', {
        title: 'Partially Updated Title via Axios',
      });
      console.log('[Axios] PATCH response data:', response.data);
    } catch (error: any) {
      console.error('[Axios] PATCH failed:', error.message);
    }
  };

  const triggerAxiosDelete = async () => {
    try {
      console.log('[Axios] Triggering DELETE...');
      const response = await axiosClient.delete('/posts/1');
      console.log('[Axios] DELETE response status:', response.status);
    } catch (error: any) {
      console.error('[Axios] DELETE failed:', error.message);
    }
  };

  const triggerNetworkRequest = async () => {
    try {
      console.log('[API] Triggering fetch user...');
      const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
      const data = await response.json();
      console.log('[API] Fetch completed successfully:', data.name);
    } catch (error) {
      console.error('[API] Fetch failed:', error);
    }
  };

  const triggerFailedNetworkRequest = async () => {
    try {
      console.log('[API] Triggering failing fetch request...');
      await fetch('https://jsonplaceholder.typicode.com/invalid-route-error');
    } catch (error) {
      console.error('[API] Fetch failed with error:', error);
    }
  };

  const triggerConsoleLogs = () => {
    console.log('[App] Manual log triggered at ' + new Date().toLocaleTimeString());
    console.warn('[App] Simulated warning. Please check the API config.');
    console.error('[App] Simulated error! Critical DB connection timeout.');
  };

  const handleToggleSidebar = () => {
    mockStore.dispatch({ type: 'TOGGLE_SIDEBAR' });
    mockStore.dispatch({ type: 'UPDATE_USER_TIME' });
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Hero Section */}
        <View style={styles.headerHero}>
          <Text style={styles.headerBadge}>INSPECTOR PLAYGROUND</Text>
          <Text style={styles.headerTitle}>Debug Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            A plug-and-play developer kit for real-time inspection.
          </Text>
        </View>

        {/* System Status Metrics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>SYSTEM STATUS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{apiCount}</Text>
              <Text style={styles.statLbl}>APIs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{logCount}</Text>
              <Text style={styles.statLbl}>Logs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#EA580C' }]}>{analyticsCount}</Text>
              <Text style={styles.statLbl}>Analytics</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#A78BFA' }]}>
                {reduxState.ui.sidebarOpen ? 'Open' : 'Closed'}
              </Text>
              <Text style={styles.statLbl}>Sidebar</Text>
            </View>
          </View>
        </View>

        {/* Action Panel Grid */}
        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>🌐 API & NETWORK TESTS</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#38BDF8' }]} onPress={triggerNetworkRequest}>
              <Text style={[styles.btnText, { color: '#38BDF8' }]}>Fetch (200 OK)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#F43F5E' }]} onPress={triggerFailedNetworkRequest}>
              <Text style={[styles.btnText, { color: '#F43F5E' }]}>Fetch (404 Err)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>⚡ AXIOS AUTOMATIC INTERCEPTION</Text>
          <View style={{ gap: 8 }}>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.gridBtn, { borderColor: '#10B981' }]} onPress={triggerAxiosGet}>
                <Text style={[styles.btnText, { color: '#10B981' }]}>Axios GET</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridBtn, { borderColor: '#8B5CF6' }]} onPress={triggerAxiosPost}>
                <Text style={[styles.btnText, { color: '#8B5CF6' }]}>Axios POST</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.gridBtn, { borderColor: '#F59E0B' }]} onPress={triggerAxiosPut}>
                <Text style={[styles.btnText, { color: '#F59E0B' }]}>Axios PUT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridBtn, { borderColor: '#38BDF8' }]} onPress={triggerAxiosPatch}>
                <Text style={[styles.btnText, { color: '#38BDF8' }]}>Axios PATCH</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridBtn, { borderColor: '#EF4444' }]} onPress={triggerAxiosDelete}>
                <Text style={[styles.btnText, { color: '#EF4444' }]}>Axios DEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>📝 CONSOLE EVENT ACTIONS</Text>
          <TouchableOpacity style={[styles.fullWidthBtn, { backgroundColor: '#6366F1' }]} onPress={triggerConsoleLogs}>
            <Text style={styles.fullWidthBtnText}>Trigger Log, Warn & Error Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>📊 ANALYTICS LOG TESTS</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.gridBtn, { borderColor: '#EA580C' }]}
              onPress={() => {
                console.log('[App] Logged custom analytics event: click_button');
                logAnalyticsEvent('click_button', {
                  button_name: 'test_action',
                  screen_name: 'Home',
                  clicked_at: new Date().toLocaleTimeString(),
                });
              }}
            >
              <Text style={[styles.btnText, { color: '#EA580C' }]}>Log Custom Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridBtn, { borderColor: '#E11D48' }]}
              onPress={() => {
                console.log('[App] Logged analytics ecommerce event: item_purchase');
                logAnalyticsEvent('item_purchase', {
                  item_id: 'prod_999',
                  item_name: 'Premium Debug Kit',
                  price: 29.99,
                  currency: 'USD',
                  items: [{ id: 'prod_999', name: 'Premium Debug Kit', price: 29.99 }],
                }, {
                  user_tier: 'gold_member',
                  signup_platform: 'ios_app',
                });
              }}
            >
              <Text style={[styles.btnText, { color: '#E11D48' }]}>Log Purchase</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>⚙️ REDUX & STATE ACTIONS</Text>
          <TouchableOpacity style={[styles.fullWidthBtn, { backgroundColor: '#8B5CF6' }]} onPress={handleToggleSidebar}>
            <Text style={styles.fullWidthBtnText}>Dispatch: Toggle Sidebar & Update Time</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>➔ ROUTING & WEBVIEW</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#10B981' }]} onPress={() => navigation.navigate('Details')}>
              <Text style={[styles.btnText, { color: '#10B981' }]}>Go to Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#F59E0B' }]} onPress={() => navigation.navigate('WebView')}>
              <Text style={[styles.btnText, { color: '#F59E0B' }]}>Go to WebView</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.panelCard, { borderColor: '#F43F5E' }]}>
          <Text style={[styles.panelHeader, { color: '#F43F5E' }]}>💥 CRASH SIMULATION TESTS</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#F43F5E', backgroundColor: 'rgba(244,63,94,0.05)' }]} onPress={() => setActiveCrash('js')}>
              <Text style={[styles.btnText, { color: '#F43F5E' }]}>JS Crash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridBtn, { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' }]} onPress={() => setActiveCrash('native')}>
              <Text style={[styles.btnText, { color: '#EF4444' }]}>Native Crash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {activeCrash !== 'none' && <BuggyComponent type={activeCrash} />}
    </SafeAreaView>
  );
}

function DetailsScreen({ navigation }: any) {
  const triggerDetailLogs = () => {
    console.log('[Details] User triggered log from Details screen.');
  };

  React.useEffect(() => {
    console.log('[Test] DetailsScreen mounted!');
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerHero}>
          <Text style={styles.headerBadge}>DETAILS MODULE</Text>
          <Text style={styles.headerTitle}>Navigation Tracking</Text>
          <Text style={styles.headerSubtitle}>
            The breadcrumbs inside the inspector track your stack route in real-time.
          </Text>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.panelHeader}>MODULE ACTIONS</Text>
          <TouchableOpacity style={[styles.fullWidthBtn, { backgroundColor: '#10B981', marginBottom: 12 }]} onPress={triggerDetailLogs}>
            <Text style={styles.fullWidthBtnText}>Trigger Log from Details Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.fullWidthBtn, { backgroundColor: '#475569' }]} onPress={() => navigation.goBack()}>
            <Text style={styles.fullWidthBtnText}>Go Back Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WebViewScreen({ navigation }: any) {
  React.useEffect(() => {
    console.log('[WebView] WebViewScreen mounted, loading apple.com...');
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: 'https://apple.com' }}
          style={{ flex: 1 }}
          onLoadStart={() => console.log('[WebView] Navigation started to apple.com')}
          onLoadEnd={() => console.log('[WebView] Navigation finished loading apple.com')}
        />
      </View>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ErrorBoundary>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: '#0F172A',
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
            <Stack.Screen name="WebView" component={WebViewScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {/* Render inspector globally exactly once at the root level */}
        <NetworkInspector />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerHero: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#818CF8',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  panelCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  panelHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  btnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  fullWidthBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidthBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default App;
