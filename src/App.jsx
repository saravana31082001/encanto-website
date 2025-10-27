import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login/Login';
import Signup from './components/signup/Signup';
import Home from './components/home/Home';
import { AppProvider, useApp } from './context/AppContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import GlobalToast from './components/common/GlobalToast';
import './App.css'

// App content component that uses the context
function AppContent() {
  const { appInitialized, loading, error, isAuthenticated, user } = useApp();

  // Show loading spinner while app is initializing
  if (!appInitialized || loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Show error if initialization failed
  if (error) {
    return (
      <div className="error-container">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <GlobalToast />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Protected routes - only accessible when authenticated */}
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Home activeSection="Dashboard" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/browse" 
            element={isAuthenticated ? <Home activeSection="BrowseEvents" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/registered" 
            element={isAuthenticated ? <Home activeSection="RegisteredEvents" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/history" 
            element={isAuthenticated ? <Home activeSection="EventHistory" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile" 
            element={isAuthenticated ? <Home activeSection="Profile" /> : <Navigate to="/login" replace />} 
          />
          {/* Host-specific routes */}
          <Route 
            path="/admin" 
            element={isAuthenticated ? <Home activeSection="AdminPanel" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/create" 
            element={isAuthenticated ? <Home activeSection="NewEvent" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/events" 
            element={isAuthenticated ? <Home activeSection="MyEvents" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/manage" 
            element={isAuthenticated ? <Home activeSection="ManageRequests" /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/home" 
            element={<Navigate to={isAuthenticated && (user?.profileType?.toLowerCase() === 'host' || user?.isHost) ? "/admin" : "/dashboard"} replace />} 
          />
          {/* Default route - redirect based on authentication and user type */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? ((user?.profileType?.toLowerCase() === 'host' || user?.isHost) ? "/admin" : "/dashboard") : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

// Main App component wrapped with provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App
