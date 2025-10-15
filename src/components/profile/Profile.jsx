import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useApp } from '../../context/AppContext';
import { useApiService } from '../../services/apiService';

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
  const { user, loading, error, updateUser } = useApp(); // Get user data from context instead of API call
  const { updateProfile } = useApiService();

  // Use user data from context (no additional API call needed)
  const userProfile = user;

  // Helper function to format phone number
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'Not provided';
    const num = phoneNumber.toString();
    // Format Indian phone number: +91 98765 43210
    if (num.length === 12 && num.startsWith('91')) {
      return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
    }
    // Fallback for other formats
    return `+${num}`;
  };

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    return `${address.streetAddress}, ${address.city}, ${address.state} ${address.postalCode}`;
  };

  // Helper function to format work location
  const formatWorkLocation = (jobLocation) => {
    if (!jobLocation) return 'Not provided';
    return `${jobLocation.city}, ${jobLocation.state}`;
  };

  // Helper function to get verification status
  const getVerificationStatus = () => {
    if (!userProfile) return '';
    return userProfile.isEmailVerified ? 'Verified' : 'Not Verified';
  };

  // Generic save function for profile updates
  const handleSaveProfile = async (field, getValue) => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const value = getValue();
      let updateData = {};
      
      // Prepare update data based on field type
      switch (field) {
        case 'name':
          updateData = { name: value };
          break;
        case 'gender':
          updateData = { gender: value };
          break;
        case 'birthday':
          updateData = { dateOfBirth: value };
          break;
        case 'phone':
          updateData = { phoneNumber: value };
          break;
        case 'address':
          updateData = { 
            address: {
              streetAddress: value.streetAddress,
              city: value.city,
              state: value.state,
              postalCode: value.postalCode,
              landmark: value.landmark
            }
          };
          break;
        case 'designation':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              designation: value
            }
          };
          break;
        case 'organization':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              organizationName: value
            }
          };
          break;
        case 'industry':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              industryDomain: value
            }
          };
          break;
        case 'employmentType':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              employmentType: value
            }
          };
          break;
        case 'workLocation':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              jobLocation: {
                city: value.city,
                state: value.state
              }
            }
          };
          break;
        case 'workEmail':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              workEmail: value
            }
          };
          break;
        case 'workPhone':
          updateData = { 
            occupationDetails: {
              ...userProfile.occupationDetails,
              workPhoneNumber: value
            }
          };
          break;
        default:
          throw new Error('Unknown field type');
      }
      
      // Try to call API to update profile
      try {
        // Add userId to updateData for API calls that need it
        // Debug: Log the user profile to see available ID fields
        console.log('User profile data:', userProfile);
        const userId = userProfile.id || userProfile._id || userProfile.userId || userProfile.Id;
        console.log('Extracted userId:', userId);
        
        const updateDataWithUserId = {
          ...updateData,
          userId: userId
        };
        await updateProfile(updateDataWithUserId);
        // If successful, refresh user data from context
        await updateUser();
      } catch (apiError) {
        // If API call fails (404 or other error), show a message but don't throw
        console.warn('API update failed, showing temporary message:', apiError);
        setSaveError('Profile update functionality is not yet available on the server. Your changes will be lost when you refresh the page.');
        
        // For now, we'll just close the popup without saving
        // In a real scenario, you might want to store changes locally or show a different message
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
                <span className="item-value">{userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}</span>
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
              <label htmlFor="birthday-input" className="popup-label">Date of Birth</label>
              <input
                id="birthday-input"
                type="date"
                className="popup-input"
                defaultValue={userProfile.dateOfBirth ? userProfile.dateOfBirth.split('T')[0] : ''}
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
                onClick={() => handleSaveProfile('birthday', () => document.getElementById('birthday-input').value)}
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
                defaultValue={userProfile.phoneNumber || ''}
                placeholder="Enter your phone number"
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
              <label htmlFor="street-input" className="popup-label">Street Address</label>
              <input
                id="street-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.streetAddress || ''}
                placeholder="Enter street address"
              />
              
              <label htmlFor="city-input" className="popup-label">City</label>
              <input
                id="city-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.city || ''}
                placeholder="Enter city"
              />
              
              <label htmlFor="state-input" className="popup-label">State</label>
              <input
                id="state-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.address?.state || ''}
                placeholder="Enter state"
              />
              
              <label htmlFor="postal-input" className="popup-label">Postal Code</label>
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
              <label htmlFor="work-city-input" className="popup-label">Work City</label>
              <input
                id="work-city-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.city || ''}
                placeholder="Enter work city"
              />
              
              <label htmlFor="work-state-input" className="popup-label">Work State</label>
              <input
                id="work-state-input"
                type="text"
                className="popup-input"
                defaultValue={userProfile.occupationDetails?.jobLocation?.state || ''}
                placeholder="Enter work state"
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
                  city: document.getElementById('work-city-input').value,
                  state: document.getElementById('work-state-input').value
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
                defaultValue={userProfile.occupationDetails?.workPhoneNumber || ''}
                placeholder="Enter work phone number"
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
  );
};

export default Profile;
