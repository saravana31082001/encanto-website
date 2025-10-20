import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useApiService } from '../../../services/apiService';
import { useApp } from '../../../context/AppContext';
import './NewEvent.css';

const NewEvent = () => {
  const { createEvent } = useApiService();
  const { user } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sendLinkNotificationAt: '',
    startDateTime: dayjs().add(1, 'hour'),
    endDateTime: dayjs().add(2, 'hour'),
    isPrivate: false,
    enableRatings: true,
    enableComments: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-set endDateTime to 1 hour after startDateTime when startDateTime changes
      if (field === 'startDateTime' && value) {
        newData.endDateTime = value.add(1, 'hour');
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (!formData.sendLinkNotificationAt) {
      newErrors.sendLinkNotificationAt = 'Please select when to send link notification';
    }

    if (!formData.startDateTime) {
      newErrors.startDateTime = 'Start date and time is required';
    }

    if (!formData.endDateTime) {
      newErrors.endDateTime = 'End date and time is required';
    }

    if (formData.startDateTime && formData.endDateTime && 
        formData.endDateTime.isBefore(formData.startDateTime)) {
      newErrors.endDateTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setSubmitMessage('User information not available. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Map form data to .NET CreateEventRequest model
      const eventData = {
        Title: formData.title,
        Description: formData.description,
        OrganizerId: user.userId || user.id, // UserId of Host
        SendLinkNotificationAt: getSendLinkNotificationValue(formData.sendLinkNotificationAt),
        EnableRating: formData.enableRatings,
        EnableComments: formData.enableComments,
        StartTimestamp: formData.startDateTime.valueOf(), // Convert to milliseconds timestamp
        EndTimestamp: formData.endDateTime.valueOf(), // Convert to milliseconds timestamp
        CreatedTimestamp: Date.now(), // Current timestamp in milliseconds
        IsPrivate: formData.isPrivate
      };

      // Call the API to create the event
      const response = await createEvent(eventData);
      
      console.log('Event created successfully:', response);
      setSubmitMessage(response.message || 'Event created successfully!');
      
      // Scroll to top of page after successful event creation
      // Use setTimeout to ensure DOM updates before scrolling
      setTimeout(() => {
        try {
          // Find the main content container that has overflow-y: auto
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
          } else {
            // Fallback to window scroll if main-content not found
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
          }
        } catch (e) {
          // Fallback for older browsers
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.scrollTop = 0;
          } else {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }
        }
      }, 100);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        sendLinkNotificationAt: '',
        startDateTime: dayjs().add(1, 'hour'),
        endDateTime: dayjs().add(2, 'hour'),
        isPrivate: false,
        enableRatings: true,
        enableComments: true
      });
      
    } catch (error) {
      console.error('Error creating event:', error);
      setSubmitMessage(`Failed to create event: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to map dropdown selection to numeric value
  const getSendLinkNotificationValue = (selection) => {
    switch (selection) {
      case 'participant-applies':
        return 1;
      case 'accepting-registrations-button':
        return 2;
      case 'manual-button':
        return 3;
      default:
        return 1; // Default to participant applies
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <div className="new-event-container">
        <div className="new-event-content">
          <div className="new-event-header">
            <h1>Create an Event</h1>
            <p>Fill in the details below to create a new event</p>
          </div>

          {submitMessage && (
            <Alert 
              severity={submitMessage.includes('successfully') ? 'success' : 'error'} 
              sx={{ mt: 2, mb: 2, mx: 3 }}
            >
              {submitMessage}
            </Alert>
          )}

          <div className="new-event-section">
            
             <Box component="form" onSubmit={handleSubmit} className="new-event-form">
               {/* Event Details Section */}
               <Typography variant="h6" className="section-title">
                 Event Details
               </Typography>
               
               {/* Title Field */}
               <TextField
                 fullWidth
                 label="Event Title"
                 value={formData.title}
                 onChange={handleInputChange('title')}
                 error={!!errors.title}
                 helperText={errors.title || `${formData.title.length}/100 characters`}
                 inputProps={{ maxLength: 100 }}
                 variant="outlined"
                 margin="normal"
                 required
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

               {/* Description Field */}
               <TextField
                 fullWidth
                 label="Description"
                 value={formData.description}
                 onChange={handleInputChange('description')}
                 error={!!errors.description}
                 helperText={errors.description || `${formData.description.length}/500 characters`}
                 inputProps={{ maxLength: 500 }}
                 variant="outlined"
                 multiline
                 rows={4}
                 margin="normal"
                 required
                 sx={{ 
                   mb: 2,
                   '& .MuiOutlinedInput-root': {
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

               {/* Send Link Notification Dropdown */}
               <FormControl 
                 fullWidth 
                 error={!!errors.sendLinkNotificationAt} 
                 required
                 variant="outlined"
                 margin="normal"
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
               >
                 <InputLabel>Send Link Notification At</InputLabel>
                 <Select
                   value={formData.sendLinkNotificationAt}
                   onChange={handleInputChange('sendLinkNotificationAt')}
                   label="Send Link Notification At"
                   MenuProps={{ PaperProps: { sx: { fontFamily: 'Inter, sans-serif' } } }}
                 >
                   <MenuItem value="participant-applies">Participant Applies for the Event</MenuItem>
                   <MenuItem value="accepting-registrations-button">Accepting-Registrations Button is turned off</MenuItem>
                   <MenuItem value="manual-button">Manual push of a Send-All Button</MenuItem>
                 </Select>
                 {errors.sendLinkNotificationAt && (
                   <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, fontFamily: 'Inter, sans-serif' }}>
                     {errors.sendLinkNotificationAt}
                   </Typography>
                 )}
               </FormControl>

              {/* Start Date Time */}
              <DateTimePicker
                label="Start Date & Time"
                value={formData.startDateTime}
                onChange={handleInputChange('startDateTime')}
                format="DD/MM/YYYY hh:mm A"
                minDateTime={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDateTime,
                    helperText: errors.startDateTime,
                    required: true,
                    margin: "normal",
                    sx: { 
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
                    }
                  },
                  actionBar: {
                    actions: ['clear', 'cancel', 'accept']
                  }
                }}
                timeFormat="12h"
                ampm={true}
              />

               {/* End Date Time */}
               <DateTimePicker
                 label="End Date & Time"
                 value={formData.endDateTime}
                 onChange={handleInputChange('endDateTime')}
                 format="DD/MM/YYYY hh:mm A"
                 minDateTime={dayjs()}
                 slotProps={{
                   textField: {
                     fullWidth: true,
                     error: !!errors.endDateTime,
                     helperText: errors.endDateTime,
                     required: true,
                     margin: "normal",
                     sx: { 
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
                     }
                   },
                   actionBar: {
                     actions: ['clear', 'cancel', 'accept']
                   }
                 }}
                 timeFormat="12h"
                 ampm={true}
               />

               {/* Divider */}
               <div className="form-divider">
                 <Divider />
               </div>

               {/* Event Settings Section */}
               <div className="settings-section">
                 <Typography variant="h6" className="settings-title">
                   Event Settings
                 </Typography>
                 
                 <div className="settings-grid">
                   <div className="setting-item">
                     <FormControlLabel
                       control={
                         <Switch
                           checked={formData.isPrivate}
                           onChange={(e) => handleInputChange('isPrivate')(e.target.checked)}
                           color="primary"
                         />
                       }
                       label="Private Event"
                     />
                     <Typography variant="caption" className="setting-description">
                       Only invited users can see this event
                     </Typography>
                   </div>

                   <div className="setting-item">
                     <FormControlLabel
                       control={
                         <Switch
                           checked={formData.enableRatings}
                           onChange={(e) => handleInputChange('enableRatings')(e.target.checked)}
                           color="primary"
                         />
                       }
                       label="Enable Ratings"
                     />
                     <Typography variant="caption" className="setting-description">
                       Allow attendees to rate the event
                     </Typography>
                   </div>

                   <div className="setting-item">
                     <FormControlLabel
                       control={
                         <Switch
                           checked={formData.enableComments}
                           onChange={(e) => handleInputChange('enableComments')(e.target.checked)}
                           color="primary"
                         />
                       }
                       label="Enable Comments"
                     />
                     <Typography variant="caption" className="setting-description">
                       Allow attendees to comment on the event
                     </Typography>
                   </div>
                 </div>
               </div>

               {/* Create Button */}
               <Button
                 type="submit"
                 fullWidth
                 variant="contained"
                 className="submit-btn"
                 disabled={isSubmitting}
                 sx={{ height: '42px', fontFamily: 'Inter, sans-serif' }}
               >
                 {isSubmitting ? 'Creating...' : 'Create Event'}
               </Button>
             </Box>
           </div>
        </div>
    </div>
    </LocalizationProvider>
  );
};

export default NewEvent;
