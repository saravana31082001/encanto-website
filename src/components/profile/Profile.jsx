import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useApp } from '../../context/AppContext';

const Profile = () => {
  const [isEditNamePopupOpen, setIsEditNamePopupOpen] = useState(false);
  const { user, loading, error } = useApp(); // Get user data from context instead of API call

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
    // Handle edit functionality for specific field
    if (field === 'name') {
      setIsEditNamePopupOpen(true);
    }
    console.log(`Edit ${field}`);
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
            <div className="profile-item" onClick={() => handleEditClick('email')}>
              <div className="item-left">
                <span className="item-label">Email</span>
                <span className="item-value">{userProfile.email}</span>
                <span className="item-description">{getVerificationStatus()}</span>
              </div>
              <div className="item-right">
                <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
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
                onClick={() => {
                  // Save functionality will be added later
                  setIsEditNamePopupOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
