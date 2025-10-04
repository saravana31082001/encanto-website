import * as signalR from "@microsoft/signalr";

// 🔗 SIGNALR CONNECTION SERVICE
// Centralized SignalR connection management for real-time updates

// Configuration - Update this URL to match your backend API
const API_BASE_URL = 'https://encanto-webapi.azurewebsites.net';
const HUB_URL = `${API_BASE_URL}/notificationhub`;

// Custom HTTP client to add session-key header
class CustomHttpClient {
  constructor() {
    this.httpClient = new signalR.DefaultHttpClient();
  }

  async send(request) {
    // Add session-key header to all requests
    const sessionKey = localStorage.getItem('session-key');
    if (sessionKey) {
      request.headers = request.headers || {};
      request.headers['session-key'] = sessionKey;
    }
    
    return this.httpClient.send(request);
  }

  getCookieString(url) {
    return this.httpClient.getCookieString(url);
  }
}

// Create the SignalR connection with custom HTTP client
export const connection = new signalR.HubConnectionBuilder()
  .withUrl(HUB_URL, {
    httpClient: new CustomHttpClient()
  })
  .withAutomaticReconnect([0, 2000, 10000, 30000]) // Reconnect attempts: immediate, 2s, 10s, 30s
  .configureLogging(signalR.LogLevel.Information)
  .build();

// Connection state management
let connectionState = {
  isConnected: false,
  isConnecting: false,
  lastError: null
};

// Connection event handlers
connection.onclose((error) => {
  console.log('SignalR connection closed:', error);
  connectionState.isConnected = false;
  connectionState.isConnecting = false;
  connectionState.lastError = error;
});

connection.onreconnecting((error) => {
  console.log('SignalR reconnecting:', error);
  connectionState.isConnecting = true;
  connectionState.lastError = error;
});

connection.onreconnected((connectionId) => {
  console.log('SignalR reconnected:', connectionId);
  connectionState.isConnected = true;
  connectionState.isConnecting = false;
  connectionState.lastError = null;
});

// Start connection function
export const startConnection = async () => {
  try {
    // Check if already connected or connecting
    if (connection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR connection already established');
      connectionState.isConnected = true;
      connectionState.isConnecting = false;
      return;
    }
    
    if (connection.state === signalR.HubConnectionState.Connecting) {
      console.log('SignalR connection already in progress');
      return;
    }

    if (connection.state === signalR.HubConnectionState.Disconnected) {
      console.log('Starting SignalR connection...');
      connectionState.isConnecting = true;
      connectionState.lastError = null;
      
      await connection.start();
      
      connectionState.isConnected = true;
      connectionState.isConnecting = false;
      console.log('SignalR connection established successfully');
    }
  } catch (error) {
    console.error('Failed to start SignalR connection:', error);
    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    connectionState.lastError = error;
    throw error;
  }
};

// Stop connection function
export const stopConnection = async () => {
  try {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      console.log('SignalR connection already stopped');
      return;
    }

    console.log('Stopping SignalR connection...');
    await connection.stop();
    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    console.log('SignalR connection stopped');
  } catch (error) {
    console.error('Failed to stop SignalR connection:', error);
    // Even if stop fails, update our state
    connectionState.isConnected = false;
    connectionState.isConnecting = false;
    throw error;
  }
};

// Get connection state
export const getConnectionState = () => {
  return {
    ...connectionState,
    hubState: connection.state
  };
};

// Subscribe to EventChanged messages
export const subscribeToEventChanges = (callback) => {
  connection.on("EventChanged", (message) => {
    callback(message);
  });
};

// Unsubscribe from EventChanged messages
export const unsubscribeFromEventChanges = () => {
  connection.off("EventChanged");
};

// Default export with all connection utilities
export default {
  connection,
  startConnection,
  stopConnection,
  getConnectionState,
  subscribeToEventChanges,
  unsubscribeFromEventChanges
};
