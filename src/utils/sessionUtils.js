import bcrypt from 'bcryptjs';

// Fixed salt for consistent hashing (in production, this should be in environment variables)
const FIXED_SALT = '$2a$10$N9qo8uLOickgx2ZMRZoMye';

// Password hashing utility
export const hashPassword = async (password) => {
  // Use bcrypt with a fixed salt to ensure same password produces same hash
  return await bcrypt.hash(password, FIXED_SALT);
};

// Session management utilities
export const sessionUtils = {
  // Get session key from localStorage
  getSessionKey: () => {
    return localStorage.getItem('session-key');
  },

  // Set session key in localStorage
  setSessionKey: (sessionKey) => {
    if (sessionKey) {
      localStorage.setItem('session-key', sessionKey);
    }
  },

  // Remove session key from localStorage
  removeSessionKey: () => {
    localStorage.removeItem('session-key');
  },

  // Check if user has a valid session
  hasValidSession: () => {
    const sessionKey = localStorage.getItem('session-key');
    return sessionKey !== null && sessionKey !== '' && sessionKey !== 'undefined';
  },

  // Clear all session data
  clearSession: () => {
    localStorage.removeItem('session-key');
    // Add any other session-related items to clear
  },

  // Handle authentication failure - clear session and redirect to login
  handleAuthFailure: () => {
    localStorage.removeItem('session-key');
    window.location.href = '/login';
  },

  // Validate session with API call
  validateSession: async (apiService, endpoint) => {
    try {
      const response = await apiService.get(endpoint);
      return { success: true, user: response };
    } catch (error) {
      // If validation fails, clear session
      localStorage.removeItem('session-key');
      return { success: false, error: error.message };
    }
  }
};

export default sessionUtils;
