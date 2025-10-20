// 🚀 UNIFIED API SERVICE - Centralized API management
// Professional API service for all HTTP requests
//Comment for updation

import {
  API_CONFIG,
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  EVENT_ENDPOINTS,
  APP_ENDPOINTS,
  HTTP_STATUS,
  HTTP_METHODS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES
} from '../constants/apiConstants.js';


// 🔧 Core API request handlers
async function makeApiCall(endpoint, method = HTTP_METHODS.GET, data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Setup request configuration
    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    // Add session key if user is authenticated
    const sessionKey = localStorage.getItem(API_CONFIG.SESSION_KEY_NAME);
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    // Add request body for POST/PUT/PATCH requests
    if (data && (method === HTTP_METHODS.POST || method === HTTP_METHODS.PUT || method === HTTP_METHODS.PATCH)) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    // Execute API request
    const response = await fetch(url, options);


    // Handle session key from response (for authentication)
    const responseSessionKey = response.headers.get('session-key');
    if (responseSessionKey) {
      localStorage.setItem(API_CONFIG.SESSION_KEY_NAME, responseSessionKey);
    }

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
        localStorage.removeItem(API_CONFIG.SESSION_KEY_NAME); // Clear invalid session
      }
      // Try to surface server-provided error text for better debugging
      let serverMessage = '';
      try {
        serverMessage = await response.text();
      } catch (_) {
        // ignore
      }
      const statusLine = `${response.status} - ${response.statusText || 'Error'}`;
      const message = serverMessage && serverMessage.trim().length > 0 ? serverMessage : statusLine;
      const err = new Error(`${ERROR_MESSAGES.API_ERROR}: ${message}`);
      // Emit global error toast
      try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message } })); } catch (_) {}
      throw err;
    }

    // Return parsed response, handling empty responses
    const responseText = await response.text();
    if (responseText.trim() === '') {
      // Success without body (no generic toast here; higher-level callers will emit specific messages)
      return { success: true, message: SUCCESS_MESSAGES.OPERATION_COMPLETED };
    }
    try {
      const parsed = JSON.parse(responseText);
      // Do not emit a generic success toast here; let callers send contextual messages
      return parsed;
    } catch (parseError) {
      // If it's not valid JSON, return the text response (no generic success toast)
      return { success: true, message: responseText };
    }
  } catch (error) {
    console.error('API call failed:', error);
    // Emit error toast if not already emitted above
    try {
      window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: error.message } }));
    } catch (_) {}
    throw error;
  }
}



// API call for creating new account 
async function createNewAccount(endpoint, method = HTTP_METHODS.POST, data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    localStorage.removeItem(API_CONFIG.SESSION_KEY_NAME); 

    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    // Add request body for the signup data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    console.log('Request body:', data);

    const response = await fetch(url, options);

    if (response.status === HTTP_STATUS.OK) {
      // Handle successful response from .NET backend
      const result = await response.text(); // Get the string response "Profile created successfully."
      console.log('Account created successfully:', result);

      return { success: true, message: result };
    } 
    else {
      // Try to extract the actual error message from the response body
      let errorMessage = `${ERROR_MESSAGES.API_ERROR}: ${response.status} - ${response.statusText}`;
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
async function loginExistingUser(endpoint, method = HTTP_METHODS.POST, data = null)  {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    // Add request body for login data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.status === HTTP_STATUS.OK) {
      // Handle successful login response from .NET backend
      const result = await response.json(); // Get the JSON response with sessionKey
      const sessionKey = result.sessionKey;
      
      // Store the session key for future API calls
      localStorage.setItem(API_CONFIG.SESSION_KEY_NAME, sessionKey);
      
      console.log('User logged in successfully, session key stored');
      return { success: true, sessionKey: sessionKey };
    } 
    else if (response.status === HTTP_STATUS.BAD_REQUEST) {
      // Handle BadRequest from backend (invalid credentials, etc.)
      const errorMessage = await response.text();
      console.error('Login failed with 400 error:', errorMessage);
      throw new Error(errorMessage || ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    else if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      // Handle Unauthorized
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS_DETAILED);
    }
    else {
      console.error('Login failed with status:', response.status, response.statusText);
      throw new Error(`${ERROR_MESSAGES.LOGIN_FAILED} (Error: ${response.status})`);
    }

  }
  catch (error) {
    console.error('loginExistingUser() API call failed:', error);
    throw error;
  }
}


// API call for logging in existing user
async function getProfileDetails(endpoint, method = HTTP_METHODS.GET, data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    // Add session key if user is authenticated
    const sessionKey = localStorage.getItem(API_CONFIG.SESSION_KEY_NAME);
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.ok) {
      return await response.json();
    } 
    else {
      localStorage.removeItem(API_CONFIG.SESSION_KEY_NAME); 
      throw new Error(`${ERROR_MESSAGES.API_ERROR}: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('getProfileDetails() API call failed:', error);
    throw error;
  }
}


// API call for creating new event
async function createNewEvent(endpoint, method = HTTP_METHODS.POST, data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    // Add session key if user is authenticated
    const sessionKey = localStorage.getItem(API_CONFIG.SESSION_KEY_NAME);
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    // Add request body for the event data
    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.status === HTTP_STATUS.OK) {
      // Handle successful response from .NET backend
      const result = await response.text(); // Get the string response
      console.log('Event created successfully:', result);

      return { success: true, message: result };
    } 
    else {
      // Try to extract the actual error message from the response body
      let errorMessage = `${ERROR_MESSAGES.API_ERROR}: ${response.status} - ${response.statusText}`;
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
async function logoutExistingUser(endpoint, method = HTTP_METHODS.POST, data = null)  {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    const sessionKey = localStorage.getItem(API_CONFIG.SESSION_KEY_NAME);
    if (sessionKey) {
      options.headers['session-key'] = sessionKey;
    }

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.status === HTTP_STATUS.OK) {
      localStorage.removeItem(API_CONFIG.SESSION_KEY_NAME); // Clear local session
      console.log('User logged out successfully');
      return { success: true };
    } 
    else {
      throw new Error(`${ERROR_MESSAGES.API_ERROR}: ${response.status} - ${response.statusText}`);
    }
  }
  catch (error) {
    console.error('logoutExistingUser() API call failed:', error);
    throw error;
  }
}



async function testDatabaseConnection(endpoint, method = HTTP_METHODS.GET, data = null) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const options = {
      method: method,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
      }
    };

    console.log('Making API call to:', url, 'with options:', options);

    const response = await fetch(url, options);

    if (response.ok) {
      // Handle text response instead of JSON
      const result = await response.text();
      return { success: true, message: result };
    } else {
      throw new Error(`${ERROR_MESSAGES.API_ERROR}: ${response.status} - ${response.statusText}`);
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
    return await loginExistingUser(AUTH_ENDPOINTS.LOGIN, HTTP_METHODS.POST, { email, passwordHash });
  },

  // Register new user account
  async register(userData) {
    return await createNewAccount(AUTH_ENDPOINTS.SIGNUP, HTTP_METHODS.POST, userData);
  },

  // End user session
  async logout() {
    const result = await logoutExistingUser(AUTH_ENDPOINTS.LOGOUT, HTTP_METHODS.POST);
    // Note: localStorage.removeItem(API_CONFIG.SESSION_KEY_NAME) is already called in logoutExistingUser
    // and will be called again in AppContext.logout, so we don't need to clear here
    return result;
  },

  // Check authentication status
  isAuthenticated() {
    return !!localStorage.getItem(API_CONFIG.SESSION_KEY_NAME);
  }
};

// 👤 USER MANAGEMENT MODULE
export const user = {
  // Get comprehensive user details
  async getDetails() {
    return await getProfileDetails(USER_ENDPOINTS.PROFILE_INFO);
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
      const res = await makeApiCall(USER_ENDPOINTS.UPDATE_GENDER, HTTP_METHODS.PUT, genderUpdateData);
      try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message: 'Gender updated successfully' } })); } catch (_) {}
      return res;
    }
    if (profileData.phoneNumber !== undefined) {
      // Format data according to UserPhnUpdateRequest
      const phoneUpdateData = {
        userId: profileData.userId || '',
        phoneNumber: profileData.phoneNumber,
        updatedTimestamp: Date.now()
      };
      const res = await makeApiCall(USER_ENDPOINTS.UPDATE_PHONE, HTTP_METHODS.PUT, phoneUpdateData);
      try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message: 'Phone number updated successfully' } })); } catch (_) {}
      return res;
    }
    if (profileData.name !== undefined) {
      // Format data according to UserNameUpdateRequest
      const nameUpdateData = {
        userId: profileData.userId || '',
        name: profileData.name,
        updatedTimestamp: Date.now()
      };
      const res = await makeApiCall(USER_ENDPOINTS.UPDATE_NAME, HTTP_METHODS.PUT, nameUpdateData);
      try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message: 'Name updated successfully' } })); } catch (_) {}
      return res;
    }
    if (profileData.dateOfBirth !== undefined) {
      // Format data according to birthday update request
      const birthdayUpdateData = {
        userId: profileData.userId || '',
        dateOfBirth: profileData.dateOfBirth, // Should be in dd-mm-yyyy format
        updatedTimestamp: Date.now()
      };
      const res = await makeApiCall(USER_ENDPOINTS.UPDATE_BIRTHDAY, HTTP_METHODS.PUT, birthdayUpdateData);
      try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message: 'Birthday updated successfully' } })); } catch (_) {}
      return res;
    }
    // For other profile updates, no generic endpoint is available anymore
    // Return a clear error to avoid calling deprecated /user/profile
    throw new Error('Unsupported profile update field. No generic profile endpoint available.');
  },

  // Update occupation/work information (selective payloads)
  async updateOccupation(occupationUpdate) {
    // Always attach required defaults
    const payload = {
      userId: occupationUpdate.userId || '',
      updatedTimestamp: Date.now()
    };

    // Include occupationId if provided
    if (occupationUpdate.occupationId) {
      payload.occupationId = occupationUpdate.occupationId;
    }

    // Work location special-case: requires full jobLocation object and addressType 'Work'
    if (occupationUpdate.jobLocation) {
      if (occupationUpdate.addressId) {
        payload.addressId = occupationUpdate.addressId;
      }

      payload.jobLocation = {
        userId: payload.userId,
        addressId: occupationUpdate.addressId || occupationUpdate.jobLocation.addressId || '',
        streetAddress: occupationUpdate.jobLocation.streetAddress,
        landmark: occupationUpdate.jobLocation.landmark || '',
        city: occupationUpdate.jobLocation.city,
        state: occupationUpdate.jobLocation.state,
        postalCode: occupationUpdate.jobLocation.postalCode,
        country: occupationUpdate.jobLocation.country,
        addressType: 'Work',
        updatedTimestamp: payload.updatedTimestamp
      };
    }

    // For scalar fields, include only the one that is present
    const scalarFields = [
      'designation',
      'industryDomain',
      'organizationName',
      'employmentType',
      'workEmail',
      'workPhoneNumber'
    ];
    for (const key of scalarFields) {
      if (occupationUpdate[key] !== undefined && occupationUpdate[key] !== null) {
        payload[key] = occupationUpdate[key];
        break; // only one field at a time
      }
    }

    const result = await makeApiCall(USER_ENDPOINTS.UPDATE_OCCUPATION, HTTP_METHODS.PUT, payload);
    // Emit contextual success messages for occupation updates
    try {
      let message = 'Updated successfully';
      if (payload.jobLocation) message = 'Work location updated successfully';
      else if (payload.designation) message = 'Designation updated successfully';
      else if (payload.organizationName) message = 'Organization updated successfully';
      else if (payload.industryDomain) message = 'Industry domain updated successfully';
      else if (payload.employmentType) message = 'Employment type updated successfully';
      else if (payload.workEmail) message = 'Work email updated successfully';
      else if (payload.workPhoneNumber) message = 'Work phone number updated successfully';
      window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message } }));
    } catch (_) {}
    return result;
  }
};

// 🎉 EVENT MANAGEMENT MODULE
export const events = {
  // Retrieve all available events
  async getAll() {
    return await makeApiCall(EVENT_ENDPOINTS.ALL_EVENTS);
  },

  // Get upcoming events for browsing
  async getBrowseUpcoming() {
    return await makeApiCall(EVENT_ENDPOINTS.BROWSE_UPCOMING);
  },

  // Get specific event details
  async getById(eventId) {
    return await makeApiCall(`${EVENT_ENDPOINTS.EVENT_BY_ID}/${eventId}`);
  },

  // Get user's registered events
  async getUserEvents() {
    return await makeApiCall(USER_ENDPOINTS.USER_EVENTS);
  },

  // Create a new event
  async create(eventData) {
    return await createNewEvent(EVENT_ENDPOINTS.NEW_EVENT, HTTP_METHODS.POST, eventData);
  },

};

// 🔔 APPLICATION UTILITIES MODULE
export const app = {
  // Test database connectivity
  async testDatabase() {
    return await testDatabaseConnection(APP_ENDPOINTS.TEST_DB_CONNECTION);
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
    getUserDetails: user.getDetails,
    updateProfile: user.updateProfile,
    updateOccupation: user.updateOccupation,

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
