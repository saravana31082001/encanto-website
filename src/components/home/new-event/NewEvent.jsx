import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
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
    meetingLink: '',
    startDateTime: dayjs().add(1, 'hour'),
    endDateTime: dayjs().add(2, 'hour'),
    isPrivate: false,
    enableRatings: true,
    enableComments: true,
    eventImageBitCode: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileName, setImageFileName] = useState('');

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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        eventImage: 'Please upload a valid image file (JPG, JPEG, or PNG)'
      }));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        eventImage: 'Image size must be less than 5MB'
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      eventImage: ''
    }));

    // Convert to base64
    //  - COMMENTED OUT - START
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   const base64String = reader.result;
    //   setFormData(prev => ({
    //     ...prev,
    //     eventImageBitCode: base64String
    //   }));
    //   setImagePreview(base64String);
    //   setImageFileName(file.name);
    // };
    // reader.readAsDataURL(file);
    //  - COMMENTED OUT - END

    // Set EventImageBitCode to "test" when image is uploaded
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData(prev => ({
        ...prev,
        eventImageBitCode: "test"
      }));
      setImagePreview(base64String);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      eventImageBitCode: null
    }));
    setImagePreview(null);
    setImageFileName('');
    // Clear the file input
    const fileInput = document.getElementById('event-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 140) {
      newErrors.title = 'Title must be 140 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    if (formData.meetingLink.trim() && !/^https?:\/\/.+/.test(formData.meetingLink.trim())) {
      newErrors.meetingLink = 'Please enter a valid URL (must start with http:// or https://)';
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
      window.dispatchEvent(new CustomEvent('api:notify', {
        detail: { message: 'User information not available. Please refresh the page.', type: 'error' }
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form data to .NET CreateEventRequest model
      const eventData = {
        Title: formData.title,
        Description: formData.description,
        MeetingLink: formData.meetingLink.trim() || '', // Always include MeetingLink (empty string if not provided)
        OrganizerId: user.userId || user.id, // UserId of Host
        EnableRating: formData.enableRatings,
        EnableComments: formData.enableComments,
        StartTimestamp: formData.startDateTime.valueOf(), // Convert to milliseconds timestamp
        EndTimestamp: formData.endDateTime.valueOf(), // Convert to milliseconds timestamp
        CreatedTimestamp: Date.now(), // Current timestamp in milliseconds
        IsPrivate: formData.isPrivate,
        EventImageBitCode: formData.eventImageBitCode || null
      };

      // Call the API to create the event
      const response = await createEvent(eventData);
      
      console.log('Event created successfully:', response);
      
      // Show success toast
      window.dispatchEvent(new CustomEvent('api:notify', {
        detail: { message: response.message || 'Event created successfully!', type: 'success' }
      }));
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        meetingLink: '',
        startDateTime: dayjs().add(1, 'hour'),
        endDateTime: dayjs().add(2, 'hour'),
        isPrivate: false,
        enableRatings: true,
        enableComments: true,
        eventImageBitCode: null
      });
      setImagePreview(null);
      setImageFileName('');
      // Clear the file input
      const fileInput = document.getElementById('event-image-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show error toast
      window.dispatchEvent(new CustomEvent('api:notify', {
        detail: { message: `Failed to create event: ${error.message}`, type: 'error' }
      }));
    } finally {
      setIsSubmitting(false);
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
                 helperText={errors.description || `${formData.description.length}/1000 characters`}
                 inputProps={{ maxLength: 1000 }}
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

               {/* Meeting Link Field */}
               <TextField
                 fullWidth
                 label="Meeting Link (Optional)"
                 value={formData.meetingLink}
                 onChange={handleInputChange('meetingLink')}
                 error={!!errors.meetingLink}
                 helperText={
                   errors.meetingLink || 
                   (formData.isPrivate 
                     ? 'Participants can view this link only after their request is approved'
                     : 'Participants can view this link after registering for the event')
                 }
                 variant="outlined"
                 margin="normal"
                 placeholder="https://example.com/meeting"
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

               {/* Event Image Upload */}
               <Box sx={{ mb: 2, mt: 1 }}>
                 <Typography variant="subtitle2" sx={{ mb: 1, fontFamily: 'Inter, sans-serif', color: '#374151', fontWeight: 500 }}>
                   Event Image (Optional)
                 </Typography>
                 <Box className="image-upload-container">
                   {!imagePreview ? (
                     <label htmlFor="event-image-upload" className="image-upload-label">
                       <input
                         id="event-image-upload"
                         type="file"
                         accept="image/jpeg,image/jpg,image/png"
                         onChange={handleImageUpload}
                         style={{ display: 'none' }}
                       />
                       <Box className="image-upload-box">
                         <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                           <circle cx="8.5" cy="8.5" r="1.5"></circle>
                           <polyline points="21 15 16 10 5 21"></polyline>
                         </svg>
                         <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Inter, sans-serif' }}>
                           Click to upload image
                         </Typography>
                         <Typography variant="caption" sx={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                           JPG, JPEG, or PNG (Max 5MB)
                         </Typography>
                       </Box>
                     </label>
                   ) : (
                     <Box className="image-preview-container">
                       <img src={imagePreview} alt="Event preview" className="image-preview" />
                       <Box className="image-preview-overlay">
                         <Typography variant="body2" sx={{ color: 'white', fontFamily: 'Inter, sans-serif', mb: 1, wordBreak: 'break-word' }}>
                           {imageFileName}
                         </Typography>
                         <Button
                           variant="contained"
                           color="error"
                           size="small"
                           onClick={handleRemoveImage}
                           sx={{ fontFamily: 'Inter, sans-serif' }}
                         >
                           Remove Image
                         </Button>
                       </Box>
                     </Box>
                   )}
                 </Box>
                 {errors.eventImage && (
                   <Typography variant="caption" sx={{ color: '#d32f2f', fontFamily: 'Inter, sans-serif', mt: 0.5, display: 'block' }}>
                     {errors.eventImage}
                   </Typography>
                 )}
               </Box>

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
                       Only permitted users can attend this event
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
