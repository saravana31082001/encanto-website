import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TextField, Button, Box, Typography, Paper, Alert } from '@mui/material';
import { hashPassword } from '../../utils/sessionUtils';
import EncantoLogo from '../../assets/SVG/EncantoLogo.svg';
import { useApiService } from '../../services/apiService'; // 🚀 Import professional API service
import { useApp } from '../../context/AppContext'; // 🎯 Import context for authentication state
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApiService(); // 🎯 Get API functions
  const { login: contextLogin, isAuthenticated } = useApp(); // 🔥 Get context login function and auth state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check for success message from signup redirect
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Pre-fill email if provided
      if (location.state.email) {
        setFormData(prev => ({
          ...prev,
          email: location.state.email
        }));
      }
      // Clear the state to prevent message from showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // 🔐 Professional login implementation with context integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear success message on form submit

    try {
      // Hash the password using the consistent method as signup
      const passwordHash = await hashPassword(formData.password);
      
      // Call the context login function which handles both API call and state update
      await contextLogin({ email: formData.email, passwordHash });
      
      // Success! Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Show error message
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-container">
      <img 
        src={EncantoLogo} 
        alt="Encanto Logo" 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          height: '40px',
          width: 'auto'
        }}
      />
      <Paper className="login-form" elevation={0}>
        <Typography variant="h4" component="h2" className="login-title" sx={{ fontFamily: 'Inter, sans-serif' }}>
          Login
        </Typography>
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2, fontFamily: 'Inter, sans-serif' }}>
            {successMessage}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Inter, sans-serif' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} className="form-content">
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            type="email"
            variant="outlined"
            margin="normal"
            required
            value={formData.email}
            onChange={handleChange}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                height: '42px',
                fontFamily: 'Inter, sans-serif'
              },
              '& .MuiInputLabel-root': {
                fontFamily: 'Inter, sans-serif',
                top: '-5px'
              },
              '& .MuiInputLabel-root.MuiInputLabel-shrink': {
                top: '0px'
              }
            }}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            required
            value={formData.password}
            onChange={handleChange}
            sx={{ 
              mb: 4,
              '& .MuiOutlinedInput-root': {
                height: '42px',
                fontFamily: 'Inter, sans-serif'
              },
              '& .MuiInputLabel-root': {
                fontFamily: 'Inter, sans-serif',
                top: '-5px'
              },
              '& .MuiInputLabel-root.MuiInputLabel-shrink': {
                top: '0px'
              }
            }}
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            className="submit-btn"
            disabled={loading} // Disable button while loading
            sx={{ mb: 2, height: '42px', fontFamily: 'Inter, sans-serif' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          
          <Typography variant="body2" className="signup-link" sx={{ fontFamily: 'Inter, sans-serif' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="signup-link-anchor">
              Sign up here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
