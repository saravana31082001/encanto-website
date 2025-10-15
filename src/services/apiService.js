// 🚀 UNIFIED API SERVICE - Centralized API management
// Professional API service for all HTTP requests
//Comment for updation

const API_BASE_URL = 'https://encanto-webapi.azurewebsites.net';
//const API_BASE_URL = 'https://localhost:7207';


// 🔧 Core API request handlers
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

    // Return parsed response, handling empty responses
    const responseText = await response.text();
    if (responseText.trim() === '') {
      // Return success indicator for empty responses
      return { success: true, message: 'Operation completed successfully' };
    }
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // If it's not valid JSON, return the text response
      return { success: true, message: responseText };
    }
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
      // Try to extract the actual error message from the response body
      let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        console.warn('Could not read error response body:', e);
      }
      throw new Error(errorMessage);
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
      console.error('Login failed with 400 error:', errorMessage);
      throw new Error(errorMessage || 'Invalid email or password. Please try again.');
    }
    else if (response.status === 401) {
      // Handle Unauthorized
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    else {
      console.error('Login failed with status:', response.status, response.statusText);
      throw new Error(`Login failed. Please try again later. (Error: ${response.status})`);
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


// API call for creating new event
async function createNewEvent(endpoint, method = 'POST', data = null) {
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

    // Add request body for the event data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.status === 200) {
      // Handle successful response from .NET backend
      const result = await response.text(); // Get the string response
      console.log('Event created successfully:', result);

      return { success: true, message: result };
    } 
    else {
      // Try to extract the actual error message from the response body
      let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        console.warn('Could not read error response body:', e);
      }
      throw new Error(errorMessage);
    }

  }
  catch (error) {
    console.error('createNewEvent() API call failed:', error);
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

    if (response.status === 200) {
      localStorage.removeItem('session-key'); // Clear local session
      console.log('User logged out successfully');
      return { success: true };
    } 
    else {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }
  }
  catch (error) {
    console.error('logoutExistingUser() API call failed:', error);
    throw error;
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
  },

  // Update user profile information
  async updateProfile(profileData) {
    // Check for specific field updates and use appropriate endpoints
    if (profileData.gender !== undefined) {
      // Format data according to the expected request format
      const genderUpdateData = {
        userId: profileData.userId || '',
        gender: profileData.gender,
        updatedTimestamp: Date.now()
      };
      return await makeApiCall('/update-user-gender', 'PUT', genderUpdateData);
    }
    if (profileData.phoneNumber !== undefined) {
      // Format data according to UserPhnUpdateRequest
      const phoneUpdateData = {
        userId: profileData.userId || '',
        phoneNumber: profileData.phoneNumber,
        updatedTimestamp: Date.now()
      };
      return await makeApiCall('/update-user-phone', 'PUT', phoneUpdateData);
    }
    if (profileData.name !== undefined) {
      // Format data according to UserNameUpdateRequest
      const nameUpdateData = {
        userId: profileData.userId || '',
        name: profileData.name,
        updatedTimestamp: Date.now()
      };
      return await makeApiCall('/update-user-name', 'PUT', nameUpdateData);
    }
    // For other profile updates, we'll need to implement specific endpoints
    // For now, fall back to the original endpoint
    return await makeApiCall('/user/profile', 'PUT', profileData);
  }
};

// 🎉 EVENT MANAGEMENT MODULE
export const events = {
  // Retrieve all available events
  async getAll() {
    return await makeApiCall('/events');
  },

  // Get upcoming events for browsing
  async getBrowseUpcoming() {
    return await makeApiCall('/events/browse-upcoming');
  },

  // Get specific event details
  async getById(eventId) {
    return await makeApiCall(`/events/${eventId}`);
  },

  // Get user's registered events
  async getUserEvents() {
    return await makeApiCall('/user/events');
  },

  // Create a new event
  async create(eventData) {
    return await createNewEvent('/events/new', 'POST', eventData);
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
    updateProfile: user.updateProfile,

    // Event management methods
    getAllEvents: events.getAll,
    getBrowseUpcomingEvents: events.getBrowseUpcoming,
    getEvent: events.getById,
    getUserEvents: events.getUserEvents,
    createEvent: events.create,

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
