import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TextField, Button, Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { hashPassword } from '../../utils/sessionUtils';
import { useApiService } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import EncantoLogo from '../../assets/SVG/EncantoLogo.svg';
import AzureLogo from '../../assets/SVG/AzureLogo.svg';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useApiService();
  const { isAuthenticated } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    signupAs: 'guest'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Hash the password using the consistent method
      const passwordHash = await hashPassword(formData.password);
      
      // Prepare signup data according to the API format
      const signupData = {
        Name: formData.name.trim(),
        Email: formData.email.trim().toLowerCase(),
        PasswordHash: passwordHash,
        ProfileType: formData.signupAs,
        CreatedTimestamp: Date.now(),
        UpdatedTimestamp: Date.now()
      };
      
      // Call the signup API
      const response = await register(signupData);
      
      console.log('Signup successful:', response);
      
      // Redirect to login page on successful signup
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in.',
          email: formData.email 
        } 
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="signup-container">
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
      <Paper className="signup-form" elevation={0}>
        <Typography variant="h4" component="h2" className="signup-title" sx={{ fontFamily: 'Inter, sans-serif' }}>
          Welcome to Encanto
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Inter, sans-serif' }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} className="form-content">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <TextField
              id="name"
              name="name"
              label="Full Name"
              variant="outlined"
              margin="normal"
              required
              value={formData.name}
              onChange={handleChange}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={{ 
                mb:1,
                flex: 1,
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
                },
                '& .MuiFormHelperText-root': {
                  fontFamily: 'Inter, sans-serif'
                }
              }}
            />
            <FormControl 
              variant="outlined" 
              margin="normal"
              sx={{ 
                minWidth: 115,
                mb: 1,
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
            >
              <InputLabel id="signupAs-label">Signup as</InputLabel>
              <Select
                labelId="signupAs-label"
                id="signupAs"
                name="signupAs"
                value={formData.signupAs}
                onChange={handleChange}
                label="Signup as"
                MenuProps={{ PaperProps: { sx: { fontFamily: 'Inter, sans-serif' } } }}
              >
                <MenuItem value="guest">Guest</MenuItem>
                <MenuItem value="host">Host</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
            error={!!validationErrors.email}
            helperText={validationErrors.email}
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
              },
              '& .MuiFormHelperText-root': {
                fontFamily: 'Inter, sans-serif'
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
            error={!!validationErrors.password}
            helperText={validationErrors.password}
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
              },
              '& .MuiFormHelperText-root': {
                fontFamily: 'Inter, sans-serif'
              }
            }}
          />

          <TextField
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            variant="outlined"
            margin="normal"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
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
              },
              '& .MuiFormHelperText-root': {
                fontFamily: 'Inter, sans-serif'
              }
            }}
          />

          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            className="submit-btn"
            disabled={loading}
            sx={{ height: '42px', fontFamily: 'Inter, sans-serif' }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
          
          <Typography variant="body2" className="login-link" sx={{ fontFamily: 'Inter, sans-serif' }}>
            Already have an account?{' '}
            <Link to="/login" className="login-link-anchor">
              Login here
            </Link>
          </Typography>
          
          {/* Powered By Section */}
          <Box className="powered-by-section">
            <Box className="powered-by-line-container">
              <Box className="powered-by-line-left"></Box>
              <Typography variant="body2" className="powered-by-text">
                Powered by
              </Typography>
              <Box className="powered-by-line-right"></Box>
            </Box>
            <Box className="azure-logo-container">
              <img 
                src={AzureLogo} 
                alt="Azure Logo" 
                className="azure-logo"
              />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
