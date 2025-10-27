// 🔧 API CONSTANTS - Centralized configuration for all API endpoints and settings
// This file contains all API-related constants for easy maintenance and updates

// 🌐 API Configuration
export const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: 'https://encanto-webapi.azurewebsites.net',
  //BASE_URL: 'https://localhost:7207',
  
  // Default headers for API requests
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Session key storage name
  SESSION_KEY_NAME: 'session-key',
};

// 🔐 Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
};

// 👤 User Management Endpoints
export const USER_ENDPOINTS = {
  PROFILE_INFO: '/profile/info',
  UPDATE_NAME: '/profile/update-user-name',
  UPDATE_PHONE: '/profile/update-user-phone-number',
  UPDATE_GENDER: '/profile/update-user-gender',
  UPDATE_BIRTHDAY: '/profile/update-user-birthday',
  UPDATE_ADDRESS: '/profile/update-user-address',
  UPDATE_OCCUPATION: '/profile/update-user-occupation',
  USER_EVENTS: '/user/events',
};

// 🎉 Event Management Endpoints
export const EVENT_ENDPOINTS = {
  ALL_EVENTS: '/events',
  BROWSE_UPCOMING: '/events/browse-upcoming',
  EVENT_BY_ID: '/events',
  NEW_EVENT: '/events/new',
  APPLY: '/events/apply',
  GET_REGISTERED: '/events/get-registered',
  GET_PAST_ATTENDED: '/events/get-past-attended',
  HOSTED_UPCOMING: '/events/hosted-upcoming',
  HOSTED_PAST: '/events/hosted-past',
  UPDATE_EVENT_STATUS: '/events/update-event-status',
  UPDATE_EVENT_DETAILS: '/events/update-event-details',
  GET_PENDING_REQUESTS: '/events/pending-requests',
  UPDATE_PENDING_REQUEST: '/events/update-pending-request',
};

// 🔔 Application Utility Endpoints
export const APP_ENDPOINTS = {
  TEST_DB_CONNECTION: '/test-db-connection',
};

// 📊 HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// 🎯 HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// 📝 Success Messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Profile created successfully.',
  EVENT_CREATED: 'Event created successfully.',
  OPERATION_COMPLETED: 'Operation completed successfully',
  LOGIN_SUCCESS: 'User logged in successfully',
  LOGOUT_SUCCESS: 'User logged out successfully',
};

// ❌ Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  INVALID_CREDENTIALS_DETAILED: 'Invalid email or password. Please check your credentials and try again.',
  LOGIN_FAILED: 'Login failed. Please try again later.',
  API_ERROR: 'API Error',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
};

// 🔧 Request Configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second delay between retries
};
