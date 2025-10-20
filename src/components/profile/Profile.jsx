import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useApp } from '../../context/AppContext';
import { useApiService } from '../../services/apiService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { USER_ENDPOINTS, HTTP_METHODS, API_CONFIG } from '../../constants/apiConstants';

const Profile = () => {
  const [isEditNamePopupOpen, setIsEditNamePopupOpen] = useState(false);
  const [isEditGenderPopupOpen, setIsEditGenderPopupOpen] = useState(false);
  const [isEditBirthdayPopupOpen, setIsEditBirthdayPopupOpen] = useState(false);
  const [isEditPhonePopupOpen, setIsEditPhonePopupOpen] = useState(false);
  const [isEditAddressPopupOpen, setIsEditAddressPopupOpen] = useState(false);
  const [isEditDesignationPopupOpen, setIsEditDesignationPopupOpen] = useState(false);
  const [isEditOrganizationPopupOpen, setIsEditOrganizationPopupOpen] = useState(false);
  const [isEditIndustryPopupOpen, setIsEditIndustryPopupOpen] = useState(false);
  const [isEditEmploymentTypePopupOpen, setIsEditEmploymentTypePopupOpen] = useState(false);
  const [isEditWorkLocationPopupOpen, setIsEditWorkLocationPopupOpen] = useState(false);
  const [isEditWorkEmailPopupOpen, setIsEditWorkEmailPopupOpen] = useState(false);
  const [isEditWorkPhonePopupOpen, setIsEditWorkPhonePopupOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [birthdayDate, setBirthdayDate] = useState(null);
  const { user, loading, error, updateUser } = useApp(); // Get user data from context instead of API call
  const { updateProfile, updateOccupation } = useApiService();
  
  // Import makeApiCall function for direct API calls
  const makeApiCall = async (endpoint, method = HTTP_METHODS.GET, data = null) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      
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

      if (data && (method === HTTP_METHODS.POST || method === HTTP_METHODS.PUT || method === HTTP_METHODS.PATCH)) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const responseText = await response.text();
      if (responseText.trim() === '') {
        return { success: true };
      }
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        return { success: true, message: responseText };
      }
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Use user data from context (no additional API call needed)
  const userProfile = user;

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'Not provided';
    const num = phoneNumber.toString();
    // Extract only the 10-digit number for display
    if (num.length === 12 && num.startsWith('91')) {
      return num.slice(2); // Return only the 10-digit number
    }
    // If it already has +91 prefix, extract the 10-digit number
    if (num.startsWith('+91') && num.length === 13) {
      return num.slice(3); // Return only the 10-digit number
    }
    // If it's already a 10-digit number, return as is
    if (num.length === 10) {
      return num;
    }
    // Fallback for other formats - try to extract 10 digits
    const digits = num.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10); // Return last 10 digits
    }
    return num; // Return original if we can't extract 10 digits
  };

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    return `${address.streetAddress}, ${address.city}, ${address.state}, ${address.country}`;
  };

  // Helper to validate email format
  const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    // Basic, robust email pattern similar to signup validation
    return /\S+@\S+\.\S+/.test(trimmed);
  };

  // Helper function to format work location (mirror home address format)
  const formatWorkLocation = (jobLocation) => {
    if (!jobLocation) return 'Not provided';
    const base = `${jobLocation.streetAddress || ''}${jobLocation.streetAddress ? ', ' : ''}` +
                 `${jobLocation.city || ''}${jobLocation.city ? ', ' : ''}` +
                 `${jobLocation.state || ''}${jobLocation.state ? ', ' : ''}` +
                 `${jobLocation.country || ''}`.trim();
    return base.trim() || 'Not provided';
  };

  // Helper function to get verification status
  const getVerificationStatus = () => {
    if (!userProfile) return '';
    return userProfile.isEmailVerified ? 'Verified' : 'Not Verified';
  };

  // Helper function to format birthday display from dd-mm-yyyy format
  const formatBirthdayDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return 'Not provided';
    
    // Handle dd-mm-yyyy format from API
    const parts = dateOfBirth.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Fallback for other formats
    return dateOfBirth;
  };

  // Generic save function for profile updates
  const handleSaveProfile = async (field, getValue) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const value = getValue();
      let updateData = {};
      
      // Validation logic
      switch (field) {
        case 'name':
          if (!value || value.trim() === '') {
            // Do not send API call for empty value; just close the popup
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Name cannot be empty' } })); } catch (_) {}
            setIsEditNamePopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { name: value.trim() };
          break;
        case 'phone':
          if (!value || value.trim() === '') {
            // Do not send API call for empty value; just close the popup
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Phone number cannot be empty' } })); } catch (_) {}
            setIsEditPhonePopupOpen(false);
            setIsSaving(false);
            return;
          }
          // Remove any non-digit characters for validation
          const phoneDigits = value.replace(/\D/g, '');
          if (phoneDigits.length !== 10) {
            setSaveError('Phone number must have exactly 10 digits.');
            setIsSaving(false);
            return;
          }
          // Add +91 prefix for API call
          updateData = { phoneNumber: `+91${phoneDigits}` };
          break;
        case 'workPhone':
          if (!value || value.trim() === '') {
            // Do not send API call for empty value; just close the popup
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Work phone number cannot be empty' } })); } catch (_) {}
            setIsEditWorkPhonePopupOpen(false);
            setIsSaving(false);
            return;
          }
          // Remove any non-digit characters for validation
          const workPhoneDigits = value.replace(/\D/g, '');
          if (workPhoneDigits.length !== 10) {
            setSaveError('Work phone number must have exactly 10 digits.');
            setIsSaving(false);
            return;
          }
          // Add +91 prefix for API call
          updateData = { workPhoneNumber: `+91${workPhoneDigits}` };
          break;
        case 'gender':
          // Validate gender - don't send empty values
          if (!value || value.trim() === '') {
            // Do not send API call for empty value; just close the popup
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Please select a gender' } })); } catch (_) {}
            setIsEditGenderPopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { gender: value };
          break;
        case 'birthday':
          // Convert dayjs date to dd-mm-yyyy format
          if (value && value.isValid()) {
            const formattedDate = value.format('DD-MM-YYYY');
            updateData = { dateOfBirth: formattedDate };
          } else {
            // If cleared or invalid, do not call API; just close the popup
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Please select a valid date of birth' } })); } catch (_) {}
            setIsEditBirthdayPopupOpen(false);
            setIsSaving(false);
            return;
          }
          break;
        case 'address':
          // Validate mandatory fields
          if (!value.streetAddress || value.streetAddress.trim() === '') {
            setSaveError('Street address is required.');
            setIsSaving(false);
            return;
          }
          if (!value.city || value.city.trim() === '') {
            setSaveError('City is required.');
            setIsSaving(false);
            return;
          }
          if (!value.state || value.state.trim() === '') {
            setSaveError('State is required.');
            setIsSaving(false);
            return;
          }
          if (!value.postalCode || value.postalCode.trim() === '') {
            setSaveError('Postal code is required.');
            setIsSaving(false);
            return;
          }
          if (!value.country || value.country.trim() === '') {
            setSaveError('Country is required.');
            setIsSaving(false);
            return;
          }
          
          // Format data according to the expected request format
          const addressUpdateData = {
            userId: userProfile.userId || userProfile._id || userProfile.Id,
            addressId: userProfile.address?.addressId || '', // Include if exists
            streetAddress: value.streetAddress.trim(),
            landmark: value.landmark?.trim() || '', // Optional field
            city: value.city.trim(),
            state: value.state.trim(),
            postalCode: value.postalCode.trim(),
            country: value.country.trim(),
            addressType: 'Home', // Must always be Home for home address
            updatedTimestamp: Date.now()
          };
          
          // Use the specific address update endpoint
          try {
            await makeApiCall(USER_ENDPOINTS.UPDATE_ADDRESS, HTTP_METHODS.PUT, addressUpdateData);
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'success', message: 'Home address updated successfully' } })); } catch (_) {}
            // If successful, refresh user data from context
            await updateUser();
          } catch (apiError) {
            console.warn('Address update failed:', apiError);
            setSaveError('Address update functionality is not yet available on the server. Your changes will be lost when you refresh the page.');
          }
          break;
        case 'designation':
          if (!value || value.trim() === '') {
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Designation cannot be empty' } })); } catch (_) {}
            setIsEditDesignationPopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { designation: value };
          break;
        case 'organization':
          if (!value || value.trim() === '') {
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Organization cannot be empty' } })); } catch (_) {}
            setIsEditOrganizationPopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { organizationName: value };
          break;
        case 'industry':
          if (!value || value.trim() === '') {
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Industry domain cannot be empty' } })); } catch (_) {}
            setIsEditIndustryPopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { industryDomain: value };
          break;
        case 'employmentType':
          if (!value || value.trim() === '') {
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Employment type cannot be empty' } })); } catch (_) {}
            setIsEditEmploymentTypePopupOpen(false);
            setIsSaving(false);
            return;
          }
          updateData = { employmentType: value };
          break;
        case 'workLocation':
          // Validate mandatory fields (same as home address)
          if (!value.streetAddress || value.streetAddress.trim() === '') {
            setSaveError('Street address is required.');
            setIsSaving(false);
            return;
          }
          if (!value.city || value.city.trim() === '') {
            setSaveError('City is required.');
            setIsSaving(false);
            return;
          }
          if (!value.state || value.state.trim() === '') {
            setSaveError('State is required.');
            setIsSaving(false);
            return;
          }
          if (!value.postalCode || value.postalCode.trim() === '') {
            setSaveError('Postal code is required.');
            setIsSaving(false);
            return;
          }
          if (!value.country || value.country.trim() === '') {
            setSaveError('Country is required.');
            setIsSaving(false);
            return;
          }

          updateData = {
            jobLocation: {
              streetAddress: value.streetAddress.trim(),
              landmark: value.landmark?.trim() || '',
              city: value.city.trim(),
              state: value.state.trim(),
              postalCode: value.postalCode.trim(),
              country: value.country.trim()
            }
          };
          break;
        case 'workEmail':
          if (!value || value.trim() === '') {
            try { window.dispatchEvent(new CustomEvent('api:notify', { detail: { type: 'error', message: 'Work email cannot be empty' } })); } catch (_) {}
            setIsEditWorkEmailPopupOpen(false);
            setIsSaving(false);
            return;
          }
          if (!isValidEmail(value)) {
            setSaveError('Please enter a valid work email address.');
            setIsSaving(false);
            return;
          }
          updateData = { workEmail: value.trim() };
          break;
        default:
          throw new Error('Unknown field type');
      }
      
      // Try to call API to update profile or occupation
      if (field !== 'address') {
        try {
          const userId = userProfile.userId || userProfile._id || userProfile.Id;
          const occupationId = userProfile.occupationDetails?.occupationId;

          if (
            field === 'designation' ||
            field === 'organization' ||
            field === 'industry' ||
            field === 'employmentType' ||
            field === 'workLocation' ||
            field === 'workEmail' ||
            field === 'workPhone'
          ) {
            const occupationPayload = {
              ...updateData,
              userId,
              occupationId,
            };

            // If work location, include addressId if exists
            if (field === 'workLocation') {
              const existingAddressId = userProfile.occupationDetails?.jobLocation?.addressId;
              if (existingAddressId) {
                occupationPayload.addressId = existingAddressId;
              }
            }

            await updateOccupation(occupationPayload);
          } else {
            const updateDataWithUserId = { ...updateData, userId };
            await updateProfile(updateDataWithUserId);
          }
          // If successful, refresh user data from context
          await updateUser();
        } catch (apiError) {
          // If API call fails (404 or other error), show a message but don't throw
          console.warn('API update failed, showing temporary message:', apiError);
          setSaveError('Profile update functionality is not yet available on the server. Your changes will be lost when you refresh the page.');
          
          // For now, we'll just close the popup without saving
          // In a real scenario, you might want to store changes locally or show a different message
        }
      }
      
      // Close the popup
      switch (field) {
        case 'name':
          setIsEditNamePopupOpen(false);
          break;
        case 'gender':
          setIsEditGenderPopupOpen(false);
          break;
        case 'birthday':
          setIsEditBirthdayPopupOpen(false);
          break;
        case 'phone':
          setIsEditPhonePopupOpen(false);
          break;
        case 'address':
          setIsEditAddressPopupOpen(false);
          break;
        case 'designation':
          setIsEditDesignationPopupOpen(false);
          break;
        case 'organization':
          setIsEditOrganizationPopupOpen(false);
          break;
        case 'industry':
          setIsEditIndustryPopupOpen(false);
          break;
        case 'employmentType':
          setIsEditEmploymentTypePopupOpen(false);
          break;
        case 'workLocation':
          setIsEditWorkLocationPopupOpen(false);
          break;
        case 'workEmail':
          setIsEditWorkEmailPopupOpen(false);
          break;
        case 'workPhone':
          setIsEditWorkPhonePopupOpen(false);
          break;
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">
          <h3>Error loading profile</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-container">
        <div className="error">No profile data available</div>
      </div>
    );
  }

  const handleEditClick = (field) => {
    // Clear any previous errors when opening a popup
    setSaveError(null);
    
    // Handle edit functionality for specific field
    switch (field) {
      case 'name':
        setIsEditNamePopupOpen(true);
        break;
      case 'gender':
        setIsEditGenderPopupOpen(true);
        break;
      case 'birthday':
        // Initialize birthday date from user profile (dd-mm-yyyy format)
        if (userProfile.dateOfBirth) {
          // Parse dd-mm-yyyy format to create dayjs object
          const parts = userProfile.dateOfBirth.split('-');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            // dayjs expects yyyy-mm-dd format, so we rearrange
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            setBirthdayDate(dayjs(isoDate));
          } else {
            setBirthdayDate(null);
          }
        } else {
          setBirthdayDate(null);
        }
        setIsEditBirthdayPopupOpen(true);
        break;
      case 'phone':
        setIsEditPhonePopupOpen(true);
        break;
      case 'address':
        setIsEditAddressPopupOpen(true);
        break;
      case 'designation':
        setIsEditDesignationPopupOpen(true);
        break;
      case 'organization':
        setIsEditOrganizationPopupOpen(true);
        break;
      case 'industry':
        setIsEditIndustryPopupOpen(true);
        break;
      case 'employmentType':
        setIsEditEmploymentTypePopupOpen(true);
        break;
      case 'workLocation':
        setIsEditWorkLocationPopupOpen(true);
        break;
      case 'workEmail':
        setIsEditWorkEmailPopupOpen(true);
        break;
      case 'workPhone':
        setIsEditWorkPhonePopupOpen(true);
        break;
      case 'email':
        // Email is not editable, just show a message or do nothing
        console.log('Email editing is not allowed');
        break;
      default:
        console.log(`Edit ${field}`);
    }
  };

  // Get colors from user profile data with fallback defaults
  const foregroundColor = userProfile?.foregroundColour || '#009688';
  const backgroundColour = userProfile?.backgroundColour || '#B2DFDB';

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div 
        className="profile-container"
        style={{
          '--profile-foreground-color': foregroundColor,
          '--profile-background-color': backgroundColour
        }}
      >
      <div className="profile-content">
        <div className="profile-header">
          <h1>Personal info</h1>
          <p>Info about you and your preferences across services</p>
        </div>

        <div className="profile-section">
          <h2>Basic info</h2>
          <p>Some info may be visible to other people using services.</p>
          
          <div className="profile-items">
            <div className="profile-item" onClick={() => handleEditClick('name')}>
              <div className="item-left">
                <span className="item-label">Name</span>
                <span className="item-value">{userProfile.name}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('gender')}>
              <div className="item-left">
                <span className="item-label">Gender</span>
                <span className="item-value">{userProfile.gender || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('birthday')}>
              <div className="item-left">
                <span className="item-label">Birthday</span>
                <span className="item-value">{userProfile.dateOfBirth ? formatBirthdayDisplay(userProfile.dateOfBirth) : 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Contact info</h2>
          
          <div className="profile-items">
            <div className="profile-item profile-item-non-editable">
              <div className="item-left">
                <span className="item-label">Email</span>
                <span className="item-value">{userProfile.email}</span>
                <span className="item-description">{getVerificationStatus()}</span>
              </div>
              <div className="item-right">
                <span className="non-editable-indicator">Not editable</span>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('phone')}>
              <div className="item-left">
                <span className="item-label">Phone</span>
                <span className="item-value">{formatPhoneNumber(userProfile.phoneNumber)}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('address')}>
              <div className="item-left">
                <span className="item-label">Home Address</span>
                <span className="item-value">{formatAddress(userProfile.address)}</span>
                {userProfile.address?.landmark && (
                  <span className="item-description">Near {userProfile.address.landmark}</span>
                )}
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Work Information</h2>
          
          <div className="profile-items">
            <div className="profile-item" onClick={() => handleEditClick('designation')}>
              <div className="item-left">
                <span className="item-label">Designation</span>
                <span className="item-value">{userProfile.occupationDetails?.designation || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('organization')}>
              <div className="item-left">
                <span className="item-label">Organization</span>
                <span className="item-value">{userProfile.occupationDetails?.organizationName || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('industry')}>
              <div className="item-left">
                <span className="item-label">Industry Domain</span>
                <span className="item-value">{userProfile.occupationDetails?.industryDomain || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('employmentType')}>
              <div className="item-left">
                <span className="item-label">Employment Type</span>
                <span className="item-value">{userProfile.occupationDetails?.employmentType || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('workLocation')}>
              <div className="item-left">
                <span className="item-label">Work Location</span>
                <span className="item-value">{formatWorkLocation(userProfile.occupationDetails?.jobLocation)}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('workEmail')}>
              <div className="item-left">
                <span className="item-label">Work Email</span>
                <span className="item-value">{userProfile.occupationDetails?.workEmail || 'Not provided'}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>

            <div className="profile-item" onClick={() => handleEditClick('workPhone')}>
              <div className="item-left">
                <span className="item-label">Work Phone</span>
                <span className="item-value">{formatPhoneNumber(userProfile.occupationDetails?.workPhoneNumber)}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Name Popup */}
      {isEditNamePopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Name</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="name-input" className="popup-label">Name</label>
              <input
                id="name-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.name}
                placeholder="Enter your name"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditNamePopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('name', () => document.getElementById('name-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gender Popup */}
      {isEditGenderPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Gender</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="gender-input" className="popup-label">Gender</label>
              <select
                id="gender-input"
                className="popup-input popup-select"
                defaultValue={userProfile.gender || ''}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditGenderPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('gender', () => document.getElementById('gender-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Birthday Popup */}
      {isEditBirthdayPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Birthday</h3>
            </div>
            <div className="popup-content">
              <label className="popup-label">Date of Birth</label>
              <DatePicker
                value={birthdayDate}
                onChange={(newValue) => setBirthdayDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
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
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditBirthdayPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('birthday', () => birthdayDate)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Phone Popup */}
      {isEditPhonePopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Phone Number</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="phone-input" className="popup-label">Phone Number</label>
              <input
                id="phone-input"
                type="tel"
                className="popup-input"
                defaultValue={userProfile.phoneNumber && typeof userProfile.phoneNumber === 'string' ? userProfile.phoneNumber.replace(/^\+91/, '') : ''}
                placeholder="Enter 10-digit phone number"
                maxLength="10"
                pattern="[0-9]{10}"
                onInput={(e) => {
                  // Only allow digits
                  e.target.value = e.target.value.replace(/\D/g, '');
                  // Limit to 10 digits
                  if (e.target.value.length > 10) {
                    e.target.value = e.target.value.slice(0, 10);
                  }
                }}
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditPhonePopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('phone', () => document.getElementById('phone-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Popup */}
      {isEditAddressPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Home Address</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="street-input" className="popup-label">Street Address <span style={{color: 'red'}}>*</span></label>
              <input
                id="street-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.streetAddress || ''}
                placeholder="Enter street address"
              />
              
              <label htmlFor="city-input" className="popup-label">City <span style={{color: 'red'}}>*</span></label>
              <input
                id="city-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.city || ''}
                placeholder="Enter city"
              />
              
              <label htmlFor="state-input" className="popup-label">State <span style={{color: 'red'}}>*</span></label>
              <input
                id="state-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.state || ''}
                placeholder="Enter state"
              />
              
              <label htmlFor="country-input" className="popup-label">Country <span style={{color: 'red'}}>*</span></label>
              <input
                id="country-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.country || ''}
                placeholder="Enter country"
              />
              
              <label htmlFor="postal-input" className="popup-label">Postal Code <span style={{color: 'red'}}>*</span></label>
              <input
                id="postal-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.postalCode || ''}
                placeholder="Enter postal code"
              />
              
              <label htmlFor="landmark-input" className="popup-label">Landmark (Optional)</label>
              <input
                id="landmark-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.landmark || ''}
                placeholder="Enter nearby landmark"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditAddressPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('address', () => ({
                  streetAddress: document.getElementById('street-input').value,
                  city: document.getElementById('city-input').value,
                  state: document.getElementById('state-input').value,
                  country: document.getElementById('country-input').value,
                  postalCode: document.getElementById('postal-input').value,
                  landmark: document.getElementById('landmark-input').value
                }))}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Designation Popup */}
      {isEditDesignationPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Designation</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="designation-input" className="popup-label">Designation</label>
              <input
                id="designation-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.designation || ''}
                placeholder="Enter your designation"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditDesignationPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('designation', () => document.getElementById('designation-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Popup */}
      {isEditOrganizationPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Organization</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="organization-input" className="popup-label">Organization Name</label>
              <input
                id="organization-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.organizationName || ''}
                placeholder="Enter organization name"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditOrganizationPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('organization', () => document.getElementById('organization-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Industry Popup */}
      {isEditIndustryPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Industry Domain</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="industry-input" className="popup-label">Industry Domain</label>
              <input
                id="industry-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.industryDomain || ''}
                placeholder="Enter industry domain"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditIndustryPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('industry', () => document.getElementById('industry-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employment Type Popup */}
      {isEditEmploymentTypePopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Employment Type</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="employment-input" className="popup-label">Employment Type</label>
              <select
                id="employment-input"
                className="popup-input popup-select"
                defaultValue={userProfile.occupationDetails?.employmentType || ''}
              >
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
              </select>
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditEmploymentTypePopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('employmentType', () => document.getElementById('employment-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Location Popup */}
      {isEditWorkLocationPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Work Location</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="work-street-input" className="popup-label">Street Address <span style={{color: 'red'}}>*</span></label>
              <input
                id="work-street-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.streetAddress || ''}
                placeholder="Enter street address"
              />

              <label htmlFor="work-city-input" className="popup-label">City <span style={{color: 'red'}}>*</span></label>
              <input
                id="work-city-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.city || ''}
                placeholder="Enter city"
              />

              <label htmlFor="work-state-input" className="popup-label">State <span style={{color: 'red'}}>*</span></label>
              <input
                id="work-state-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.state || ''}
                placeholder="Enter state"
              />

              <label htmlFor="work-country-input" className="popup-label">Country <span style={{color: 'red'}}>*</span></label>
              <input
                id="work-country-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.country || ''}
                placeholder="Enter country"
              />

              <label htmlFor="work-postal-input" className="popup-label">Postal Code <span style={{color: 'red'}}>*</span></label>
              <input
                id="work-postal-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.postalCode || ''}
                placeholder="Enter postal code"
              />

              <label htmlFor="work-landmark-input" className="popup-label">Landmark (Optional)</label>
              <input
                id="work-landmark-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.landmark || ''}
                placeholder="Enter nearby landmark"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditWorkLocationPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('workLocation', () => ({
                  streetAddress: document.getElementById('work-street-input').value,
                  city: document.getElementById('work-city-input').value,
                  state: document.getElementById('work-state-input').value,
                  country: document.getElementById('work-country-input').value,
                  postalCode: document.getElementById('work-postal-input').value,
                  landmark: document.getElementById('work-landmark-input').value
                }))}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Email Popup */}
      {isEditWorkEmailPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Work Email</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="work-email-input" className="popup-label">Work Email</label>
              <input
                id="work-email-input"
                type="email"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.workEmail || ''}
                placeholder="Enter work email"
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditWorkEmailPopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('workEmail', () => document.getElementById('work-email-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Phone Popup */}
      {isEditWorkPhonePopupOpen && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h3>Edit Work Phone</h3>
            </div>
            <div className="popup-content">
              <label htmlFor="work-phone-input" className="popup-label">Work Phone Number</label>
              <input
                id="work-phone-input"
                type="tel"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.workPhoneNumber && typeof userProfile.occupationDetails.workPhoneNumber === 'string' ? userProfile.occupationDetails.workPhoneNumber.replace(/^\+91/, '') : ''}
                placeholder="Enter 10-digit work phone number"
                maxLength="10"
                pattern="[0-9]{10}"
                onInput={(e) => {
                  // Only allow digits
                  e.target.value = e.target.value.replace(/\D/g, '');
                  // Limit to 10 digits
                  if (e.target.value.length > 10) {
                    e.target.value = e.target.value.slice(0, 10);
                  }
                }}
              />
              {saveError && (
                <div className="popup-error" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-button popup-button-cancel"
                onClick={() => setIsEditWorkPhonePopupOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="popup-button popup-button-save"
                onClick={() => handleSaveProfile('workPhone', () => document.getElementById('work-phone-input').value)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </LocalizationProvider>
  );
};

export default Profile;
