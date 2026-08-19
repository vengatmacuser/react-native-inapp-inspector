export interface MockStoreState {
  auth: {
    user: { id: number; name: string; role: string };
    token: string;
    isAuthenticated: boolean;
    lastLogin: string;
  };
  settings: {
    theme: string;
    notifications: boolean;
    fontSize: number;
    locales: string[];
  };
  ui: {
    sidebarOpen: boolean;
    activeModal: string | null;
    loadingStates: {
      fetchUser: boolean;
      updateSettings: boolean;
    };
  };
}

export const mockStore = {
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
  } as MockStoreState,
  listeners: new Set<() => void>(),
  getState(): MockStoreState {
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
    } else if (action.type === 'UPDATE_USER_TIME' || action.type === 'auth/loginWithSaga') {
      this.state = {
        ...this.state,
        auth: {
          ...this.state.auth,
          lastLogin: new Date().toLocaleTimeString(),
        },
      };
    } else if (action.type === 'users/fetch/fulfilled') {
      this.state = {
        ...this.state,
        auth: {
          ...this.state.auth,
          user: { ...this.state.auth.user, ...action.payload },
        },
      };
    }
    this.listeners.forEach(l => l());
  },
};
