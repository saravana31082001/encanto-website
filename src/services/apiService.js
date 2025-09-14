// 🚀 UNIFIED API SERVICE - Centralized API management
// Professional API service for all HTTP requests

const API_BASE_URL = 'https://encanto-webapi.azurewebsites.net';
//const API_BASE_URL = 'https://localhost:7207';


// 🔧 Core API request handler
async function makeApiCall(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Setup request configuration
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add session key if user is authenticated
    const sessionKey = localStorage.getItem('session-key');
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    // Add request body for POST/PUT/PATCH requests
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    // Execute API request
    const response = await fetch(url, options);

    console.log('API response status:', response.status);
    console.log('API response headers:', [...response.headers.entries()]);


    // Handle session key from response (for authentication)
    const responseSessionKey = response.headers.get('session-key');
    if (responseSessionKey) {
      localStorage.setItem('session-key', responseSessionKey);
    }

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('session-key'); // Clear invalid session
      }
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    // Return parsed response
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}



// API call for creating new account 
async function createNewAccount(endpoint, method = 'POST', data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    localStorage.removeItem('session-key'); 

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add request body for the signup data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    console.log('Request body:', data);

    const response = await fetch(url, options);

    if (response.status === 200) {
      // Handle successful response from .NET backend
      const result = await response.text(); // Get the string response "Profile created successfully."
      console.log('Account created successfully:', result);

      return { success: true, message: result };
    } 
    else {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

  }
  catch (error) {
    console.error('createNewAccount() API call failed:', error);
    throw error;
  }
}


// API call for logging in existing user
async function loginExistingUser(endpoint, method = 'POST', data = null)  {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add request body for login data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.status === 200) {
      // Handle successful login response from .NET backend
      const result = await response.json(); // Get the JSON response with sessionKey
      const sessionKey = result.sessionKey;
      
      // Store the session key for future API calls
      localStorage.setItem('session-key', sessionKey);
      
      console.log('User logged in successfully, session key stored');
      return { success: true, sessionKey: sessionKey };
    } 
    else if (response.status === 400) {
      // Handle BadRequest from backend (invalid credentials, etc.)
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }
    else {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

  }
  catch (error) {
    console.error('loginExistingUser() API call failed:', error);
    throw error;
  }
}


// API call for logging in existing user
async function getProfileDetails(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add session key if user is authenticated
    const sessionKey = localStorage.getItem('session-key');
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.ok) {
      return await response.json();
    } 
    else {
      localStorage.removeItem('session-key'); 
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('getProfileDetails() API call failed:', error);
    throw error;
  }
}



// API call for logging out existing user
async function logoutExistingUser(endpoint, method = 'POST', data = null)  {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const sessionKey = localStorage.getItem('session-key');
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    // Handle different response status codes
    if (response.status === 200) {
      localStorage.removeItem('session-key'); // Clear local session
      console.log('User logged out successfully');
      return { success: true };
    } 
    else if (response.status === 400) {
      // Handle 400 Bad Request - this might still be a successful logout
      // The session might be invalid/expired, but we should still clear local session
      console.warn('Logout API returned 400 Bad Request - clearing local session anyway');
      localStorage.removeItem('session-key'); // Clear local session
      
      // Try to get error details from response
      let errorMessage = 'Bad Request';
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      console.log('User logged out locally (API returned 400):', errorMessage);
      return { success: true, warning: `API returned 400: ${errorMessage}` };
    }
    else if (response.status === 401 || response.status === 403) {
      // Session is invalid/expired - clear local session and treat as successful logout
      console.log('Session invalid/expired - clearing local session');
      localStorage.removeItem('session-key');
      return { success: true, warning: 'Session was already invalid' };
    }
    else {
      // For other errors, still clear local session but log the error
      console.error(`Logout API error: ${response.status} - ${response.statusText}`);
      localStorage.removeItem('session-key'); // Clear local session anyway
      return { success: true, warning: `API error: ${response.status} - ${response.statusText}` };
    }
  }
  catch (error) {
    console.error('logoutExistingUser() API call failed:', error);
    // Even if the API call fails completely, clear the local session
    localStorage.removeItem('session-key');
    return { success: true, warning: `Network error: ${error.message}` };
  }
}



async function testDatabaseConnection(endpoint, method = 'GET', data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.ok) {
      // Handle text response instead of JSON
      const result = await response.text();
      return { success: true, message: result };
    } else {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('testDatabaseConnection() API call failed:', error);
    throw error;
  }

}










//======================================================================================


// 🔐 AUTHENTICATION MODULE
export const auth = {
  // Authenticate user credentials
  async login(email, passwordHash) {
    return await loginExistingUser('/auth/login', 'POST', { email, passwordHash });
  },

  // Register new user account
  async register(userData) {
    return await createNewAccount('/auth/signup', 'POST', userData);
  },

  // End user session
  async logout() {
    const result = await logoutExistingUser('/auth/logout', 'POST');
    // Note: localStorage.removeItem('session-key') is already called in logoutExistingUser
    // and will be called again in AppContext.logout, so we don't need to clear here
    return result;
  },

  // Check authentication status
  isAuthenticated() {
    return !!localStorage.getItem('session-key');
  }
};

// 👤 USER MANAGEMENT MODULE
export const user = {
  // Retrieve user profile information
  async getProfile() {
    return await makeApiCall('/user/profile');
  },
  
  // Get comprehensive user details
  async getDetails() {
    return await getProfileDetails('/profileinfo');
  }
};

// 🎉 EVENT MANAGEMENT MODULE
export const events = {
  // Retrieve all available events
  async getAll() {
    return await makeApiCall('/events');
  },

  // Get specific event details
  async getById(eventId) {
    return await makeApiCall(`/events/${eventId}`);
  },

  // Get user's registered events
  async getUserEvents() {
    return await makeApiCall('/user/events');
  },

};

// 🔔 APPLICATION UTILITIES MODULE
export const app = {
  // Test database connectivity
  async testDatabase() {
    return await testDatabaseConnection('/test-db-connection');
  },
};

// 🎯 UNIFIED API HOOK FOR REACT COMPONENTS
// Provides centralized access to all API functions
export const useApiService = () => {
  return {
    // Authentication methods
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    isAuthenticated: auth.isAuthenticated,

    // User management methods
    getUserProfile: user.getProfile,
    getUserDetails: user.getDetails,

    // Event management methods
    getAllEvents: events.getAll,
    getEvent: events.getById,
    getUserEvents: events.getUserEvents,

    // Application utilities
    testDatabase: app.testDatabase,

  };
};

// Default export with all modules
export default {
  auth,
  user,
  events,
  app,
  useApiService
};
