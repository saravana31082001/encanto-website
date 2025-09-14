import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { auth, user, app } from '../services/apiService';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  appInitialized: false,
  sessionKey: null,
  loading: false,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_APP_INITIALIZED: 'SET_APP_INITIALIZED',
  SET_SESSION_KEY: 'SET_SESSION_KEY',
  LOGOUT: 'LOGOUT',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    case actionTypes.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload };
    case actionTypes.SET_APP_INITIALIZED:
      return { ...state, appInitialized: action.payload, loading: false };
    case actionTypes.SET_SESSION_KEY:
      return { ...state, sessionKey: action.payload };
    case actionTypes.LOGOUT:
      return { ...state, user: null, isAuthenticated: false, sessionKey: null };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const initializeOnce = useRef(false);

  // Test database connection function
  const callTestDbConnection = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔗 Testing database connection...');
      }
      
      const data = await app.testDatabase();
      
      console.log('📊 Test DB Connection Response:', data);
      
      if (import.meta.env.DEV) {
        console.log('✅ Database connection test completed successfully');
      }
      
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('❌ CORS Error: Your .NET Web API backend needs CORS configuration');
        console.error('🔧 Backend is running on: https://encanto-webapi.azurewebsites.net/swagger/index.html');
        console.error('🌐 Frontend is running on: http://localhost:5173');
        console.error('💡 Add CORS policy to your .NET Web API to allow http://localhost:5173');
      } else {
        console.error('❌ Test DB Connection failed:', error);
      }
      
      if (import.meta.env.DEV) {
        console.log(' This is expected if CORS is not configured on your .NET Web API backend');
      }
    }
  };

  // Initialize app - this will be called when the app starts
  const initializeApp = useCallback(async () => {
    // Prevent duplicate initialization in React Strict Mode
    if (initializeOnce.current) {
      return;
    }
    
    initializeOnce.current = true;
    
    // Only log once to avoid confusion in development
    if (import.meta.env.DEV) {
      console.log('🚀 App initialization started');
    }
    
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // IMPORTANT: Check if session-key exists in localStorage FIRST
      const sessionKey = localStorage.getItem('session-key');
      
      if (!sessionKey) {
        // No session-key exists - DO NOT make API call
        // User needs to login - router will redirect to /login
        if (import.meta.env.DEV) {
          console.log('📝 No session-key found, user needs to login');
        }
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: false });
        dispatch({ type: actionTypes.SET_APP_INITIALIZED, payload: true });
        
        if (import.meta.env.DEV) {
          console.log('🏁 App initialization completed (no session)');
        }
        
        // Call test DB connection API after initialization
        await callTestDbConnection();
        return;
      }

      // Session-key exists - NOW make the API call to validate it
      if (import.meta.env.DEV) {
        console.log('🔑 Session-key found, validating with /getUserDetails');
      }
      
      try {
        const userData = await user.getDetails();
        
        // If successful, user is logged in
        if (import.meta.env.DEV) {
          console.log('✅ Session validation successful, user logged in');
        }
        dispatch({ type: actionTypes.SET_SESSION_KEY, payload: sessionKey });
        dispatch({ type: actionTypes.SET_USER, payload: userData });
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: true });
        
      } catch (error) {
        // If getUserDetails fails, clear session and let router redirect to login
        console.error('❌ Session validation failed, clearing session:', error);
        localStorage.removeItem('session-key');
        dispatch({ type: actionTypes.SET_SESSION_KEY, payload: null });
        dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: false });
        dispatch({ type: actionTypes.SET_USER, payload: null });
      }
      
      dispatch({ type: actionTypes.SET_APP_INITIALIZED, payload: true });
      
      if (import.meta.env.DEV) {
        console.log('🏁 App initialization completed (with session validation)');
      }
      
      // Call test DB connection API after initialization
      await callTestDbConnection();
    } catch (error) {
      console.error('💥 App initialization failed:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_APP_INITIALIZED, payload: true });
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    
    try {
      // Use the unified auth.login function from apiService
      const response = await auth.login(credentials.email, credentials.passwordHash);
      
      // Check if session-key was stored in localStorage by the API service
      const sessionKey = localStorage.getItem('session-key');
      
      if (sessionKey) {
        dispatch({ type: actionTypes.SET_SESSION_KEY, payload: sessionKey });
        
        // After login, call getUserDetails to get user data
        try {
          // Use the unified apiService for getUserDetails
          const userData = await user.getDetails();
          dispatch({ type: actionTypes.SET_USER, payload: userData });
          dispatch({ type: actionTypes.SET_AUTHENTICATED, payload: true });
        } catch (error) {
          // If getUserDetails fails after login, something is wrong
          console.error('Failed to get user details after login:', error);
          localStorage.removeItem('session-key');
          throw new Error('Login succeeded but failed to retrieve user details');
        }
      } else {
        throw new Error('Login succeeded but no session key was received');
      }
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the API logout endpoint
      await auth.logout();
      console.log('Successfully logged out from server');
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always perform local cleanup
      localStorage.removeItem('session-key');
      dispatch({ type: actionTypes.LOGOUT });
      // Let React Router handle the navigation instead of hard redirect
      // The Navigate components in App.jsx will automatically redirect to /login
    }
  };

  // Initialize app on component mount
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const value = {
    ...state,
    login,
    logout,
    initializeApp,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
