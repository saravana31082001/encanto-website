import React, { useState, useEffect } from "react";
import "./MyEvents.css";
import { useApiService } from "../../../services/apiService";
import { useApp } from "../../../context/AppContext";
import ImageViewer from "../../common/ImageViewer";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import defaultEventImage from "../../../assets/SVG/JPG/sample_image.jpg";

const MyEvents = () => {
  const [overdueEventsData, setOverdueEventsData] = useState([]);
  const [upcomingEventsData, setUpcomingEventsData] = useState([]);
  const [completedEventsData, setCompletedEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);
  const [isDetailsEventOverdue, setIsDetailsEventOverdue] = useState(false);
  const [isDetailsEventUpcoming, setIsDetailsEventUpcoming] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    meetingLink: '',
    startTimestamp: null,
    endTimestamp: null,
    isAcceptingParticipants: true
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  const apiService = useApiService();
  const { user: currentUser } = useApp();

  // Helper function to sort events by start time (earliest first)
  const sortEventsByStartTime = (events) => {
    return events.sort((a, b) => {
      const startTimeA = a.StartTimestamp || a.startTimestamp || a.startTime || a.start_time;
      const startTimeB = b.StartTimestamp || b.startTimestamp || b.startTime || b.start_time;
      
      if (!startTimeA && !startTimeB) return 0;
      if (!startTimeA) return 1; // Put events without start time at the end
      if (!startTimeB) return -1;
      
      return new Date(startTimeA) - new Date(startTimeB);
    });
  };

  // Helper function to get participant count for an event
  // For private events, only count participants with registration status 1 (accepted)
  // For public events, use total count or count all participants
  const getParticipantCount = (event) => {
    const isPrivate = event.IsPrivate || event.isPrivate || event.private;
    
    if (isPrivate) {
      // For private events, count only accepted participants (status === 1)
      const participants = event.Participants || event.participants || [];
      return participants.filter(p => {
        const status = p.registrationStatus !== undefined ? p.registrationStatus : p.RegistrationStatus;
        return status === 1;
      }).length;
    } else {
      // For public events, use the total count or count all participants
      return event.totalRegisteredParticipants || event.TotalRegisteredParticipants || (event.Participants || event.participants || []).length;
    }
  };

  // Load events data from API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userId = currentUser.userId || currentUser._id || currentUser.Id;
        
        // Fetch both upcoming and past events in parallel
        const [hostedUpcomingEvents, pastEvents] = await Promise.all([
          apiService.getHostedUpcomingEvents(userId),
          apiService.getHostedPastEvents(userId)
        ]);

        const upcomingArray = Array.isArray(hostedUpcomingEvents) ? hostedUpcomingEvents : [hostedUpcomingEvents];
        const pastArray = Array.isArray(pastEvents) ? pastEvents : [pastEvents];
        
        // Split upcoming events into overdue and upcoming
        const now = new Date();
        const overdueEvents = [];
        const actualUpcomingEvents = [];
        
        upcomingArray.forEach(event => {
          const endTime = event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time;
          const active = event.Active !== undefined ? event.Active : event.active;
          
          // Check if event is overdue: active === 1 and endTimestamp is in the past
          if (active === 1 && endTime && new Date(endTime) < now) {
            overdueEvents.push(event);
          } else {
            actualUpcomingEvents.push(event);
          }
        });
        
        const sortedOverdue = sortEventsByStartTime(overdueEvents);
        const sortedUpcoming = sortEventsByStartTime(actualUpcomingEvents);
        const sortedPast = sortEventsByStartTime(pastArray);
        
        setOverdueEventsData(sortedOverdue);
        setUpcomingEventsData(sortedUpcoming);
        setCompletedEventsData(sortedPast);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err.message || 'Failed to load events');
        setOverdueEventsData([]);
        setUpcomingEventsData([]);
        setCompletedEventsData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Reload when user changes

  // Handle details modal
  const handleViewDetails = (event, isFromUpcoming = false) => {
    // Check if this event is overdue
    const now = new Date();
    const endTime = event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time;
    const active = event.Active !== undefined ? event.Active : event.active;
    const isOverdue = active === 1 && endTime && new Date(endTime) < now;
    
    setDetailsModalEvent(event);
    setIsDetailsEventOverdue(isOverdue);
    setIsDetailsEventUpcoming(isFromUpcoming);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setDetailsModalEvent(null);
    setIsDetailsEventOverdue(false);
    setIsDetailsEventUpcoming(false);
    setIsEditMode(false);
    setEditFormData({
      title: '',
      description: '',
      meetingLink: '',
      startTimestamp: null,
      endTimestamp: null,
      isAcceptingParticipants: true
    });
    setEditFormErrors({});
  };

  const handleViewAttachment = (imageUrl, openInNewTab = false) => {
    if (openInNewTab) {
      // Open image in a new tab
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Event Image</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${imageUrl}" alt="Event Image" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Open in popup modal
      setSelectedImage(imageUrl);
      setImageViewerVisible(true);
    }
  };

  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  };

  // Handle entering edit mode
  const handleEnterEditMode = () => {
    if (!detailsModalEvent) return;

    const startTime = detailsModalEvent.StartTimestamp || detailsModalEvent.startTimestamp;
    const endTime = detailsModalEvent.EndTimestamp || detailsModalEvent.endTimestamp;

    setEditFormData({
      title: detailsModalEvent.title || detailsModalEvent.Title || '',
      description: detailsModalEvent.description || detailsModalEvent.Description || '',
      meetingLink: detailsModalEvent.MeetingLink || detailsModalEvent.meetingLink || '',
      startTimestamp: startTime ? dayjs(startTime) : null,
      endTimestamp: endTime ? dayjs(endTime) : null,
      isAcceptingParticipants: detailsModalEvent.Is_accepting_participants !== undefined 
        ? detailsModalEvent.Is_accepting_participants 
        : detailsModalEvent.isAcceptingParticipants !== undefined
        ? detailsModalEvent.isAcceptingParticipants
        : true
    });
    setIsEditMode(true);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData({
      title: '',
      description: '',
      meetingLink: '',
      startTimestamp: null,
      endTimestamp: null,
      isAcceptingParticipants: true
    });
    setEditFormErrors({});
  };

  // Handle form field changes
  const handleEditFieldChange = (field, value) => {
    setEditFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-set endTimestamp to 1 hour after startTimestamp when startTimestamp changes
      if (field === 'startTimestamp' && value) {
        newData.endTimestamp = value.add(1, 'hour');
      }
      
      return newData;
    });
    
    // Clear error for this field when user starts typing
    if (editFormErrors[field]) {
      setEditFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle saving edited event
  const handleSaveEdit = async () => {
    if (!detailsModalEvent) return;

    const eventId = detailsModalEvent.EventId || detailsModalEvent.eventId || detailsModalEvent.id;
    if (!eventId) {
      console.error('Event ID not found');
      return;
    }

    // Validate form fields
    const newErrors = {};
    
    if (!editFormData.title || !editFormData.title.trim()) {
      newErrors.title = 'Title is required and cannot be empty';
    } else if (editFormData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }
    
    if (!editFormData.description || !editFormData.description.trim()) {
      newErrors.description = 'Description is required and cannot be empty';
    } else if (editFormData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }
    
    // Validate meeting link format (if provided)
    if (editFormData.meetingLink && editFormData.meetingLink.trim() && 
        !/^https?:\/\/.+/.test(editFormData.meetingLink.trim())) {
      newErrors.meetingLink = 'Please enter a valid URL (must start with http:// or https://)';
    }
    
    if (!editFormData.startTimestamp) {
      newErrors.startTimestamp = 'Start date and time is required';
    }
    
    if (!editFormData.endTimestamp) {
      newErrors.endTimestamp = 'End date and time is required';
    }

    // Validate start time is before end time
    if (editFormData.startTimestamp && editFormData.endTimestamp && 
        editFormData.startTimestamp.valueOf() >= editFormData.endTimestamp.valueOf()) {
      newErrors.endTimestamp = 'End time must be after start time';
    }
    
    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setEditFormErrors(newErrors);
      return;
    }

    try {
      setIsSavingEdit(true);

      // Prepare request data according to EditEventDetailsRequest
      // If meeting link is empty, send empty string
      const requestData = {
        EventId: eventId,
        Title: editFormData.title.trim(),
        Description: editFormData.description.trim(),
        MeetingLink: editFormData.meetingLink ? editFormData.meetingLink.trim() : '',
        StartTimestamp: editFormData.startTimestamp.valueOf(),
        EndTimestamp: editFormData.endTimestamp.valueOf(),
        Is_accepting_participants: editFormData.isAcceptingParticipants,
        UpdatedTimestamp: Date.now()
      };

      await apiService.updateEventDetails(requestData);

      // Close edit mode and modal
      setIsEditMode(false);
      handleCloseDetailsModal();

      // Reload events data
      if (currentUser) {
        const userId = currentUser.userId || currentUser._id || currentUser.Id;
        const [hostedUpcomingEvents, pastEvents] = await Promise.all([
          apiService.getHostedUpcomingEvents(userId),
          apiService.getHostedPastEvents(userId)
        ]);

        const upcomingArray = Array.isArray(hostedUpcomingEvents) ? hostedUpcomingEvents : [hostedUpcomingEvents];
        const pastArray = Array.isArray(pastEvents) ? pastEvents : [pastEvents];
        
        const now = new Date();
        const overdueEvents = [];
        const actualUpcomingEvents = [];
        
        upcomingArray.forEach(event => {
          const endTime = event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time;
          const active = event.Active !== undefined ? event.Active : event.active;
          
          if (active === 1 && endTime && new Date(endTime) < now) {
            overdueEvents.push(event);
          } else {
            actualUpcomingEvents.push(event);
          }
        });
        
        setOverdueEventsData(sortEventsByStartTime(overdueEvents));
        setUpcomingEventsData(sortEventsByStartTime(actualUpcomingEvents));
        setCompletedEventsData(sortEventsByStartTime(pastArray));
      }
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle mark as complete
  const handleMarkAsComplete = async () => {
    if (!detailsModalEvent) return;
    
    const eventId = detailsModalEvent.EventId || detailsModalEvent.eventId || detailsModalEvent.id || detailsModalEvent._id;
    if (!eventId) {
      console.error('Event ID not found');
      return;
    }

    try {
      setIsMarkingComplete(true);
      await apiService.updateEventStatus(eventId, 0);
      
      // Close modal and reload events
      handleCloseDetailsModal();
      
      // Reload events data
      if (currentUser) {
        const userId = currentUser.userId || currentUser._id || currentUser.Id;
        const [hostedUpcomingEvents, pastEvents] = await Promise.all([
          apiService.getHostedUpcomingEvents(userId),
          apiService.getHostedPastEvents(userId)
        ]);

        const upcomingArray = Array.isArray(hostedUpcomingEvents) ? hostedUpcomingEvents : [hostedUpcomingEvents];
        const pastArray = Array.isArray(pastEvents) ? pastEvents : [pastEvents];
        
        const now = new Date();
        const overdueEvents = [];
        const actualUpcomingEvents = [];
        
        upcomingArray.forEach(event => {
          const endTime = event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time;
          const active = event.Active !== undefined ? event.Active : event.active;
          
          if (active === 1 && endTime && new Date(endTime) < now) {
            overdueEvents.push(event);
          } else {
            actualUpcomingEvents.push(event);
          }
        });
        
        setOverdueEventsData(sortEventsByStartTime(overdueEvents));
        setUpcomingEventsData(sortEventsByStartTime(actualUpcomingEvents));
        setCompletedEventsData(sortEventsByStartTime(pastArray));
      }
    } catch (err) {
      console.error('Failed to mark event as complete:', err);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Format schedule (date + start–end time)
  const formatSchedule = (start, end) => {
    if (!start || !end) return { date: "", timeRange: "" };

    const startDate = new Date(start);
    const endDate = new Date(end);

    const date = startDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const timeRange = `${startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })} - ${endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;

    return { date, timeRange };
  };

  // Render event card
  const renderEventCard = (event, isFromUpcoming = false) => {
    if (!event) return null;
    
    const eventId = event.EventId || event.eventId || event.id || event._id;
    if (!eventId) return null;
    
    const { date, timeRange } = formatSchedule(
      event.StartTimestamp || event.startTimestamp || event.startTime || event.start_time,
      event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time
    );

    return (
      <div key={eventId} className="event-card">
        {/* Left Section - Event Details */}
        <div className="event-left-section">
          <div className="event-header">
            <h2 className="event-title">{event.title || event.Title || event.eventTitle || event.name || event.eventName || 'Untitled Event'}</h2>
          </div>
          <p className="event-description">{event.description || event.Description || event.eventDescription || 'No description available'}</p>
          {(event.IsPrivate || event.isPrivate || event.private) && (
            <div className="private-indicator">
              <span className="lock-icon">🔒</span>
              <span className="private-text">Private</span>
            </div>
          )}
        </div>

        {/* Right Section - Organizer and Schedule */}
        <div className="event-right-section">
          <div className="participants-info">
            <span className="participants-label">Participants:</span>
            <span className="participants-count">
              {getParticipantCount(event)}
            </span>
          </div>
          
          <div className="schedule-info">
            <div className="schedule-label">Scheduled on:</div>
            <div className="schedule-date">{date}</div>
            <div className="schedule-time">{timeRange}</div>
          </div>
          
          <div className="event-actions">
            <button className="view-details-button" onClick={() => handleViewDetails(event, isFromUpcoming)}>
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="my-events-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="my-events-container">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-events-container">
      {/* Header */}
      <div className="my-events-header">
        <h1>My Events</h1>
        <p>Manage all events you are hosting</p>
      </div>

      {/* Overdue Events Section */}
      {overdueEventsData.length > 0 && (
        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">Overdue</h2>
          </div>
          <div className="events-grid">
            {overdueEventsData.map(event => renderEventCard(event))}
          </div>
        </div>
      )}

      {/* Upcoming Events Section */}
      {upcomingEventsData.length > 0 && (
        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming</h2>
          </div>
          <div className="events-grid">
            {upcomingEventsData.map(event => renderEventCard(event, true))}
          </div>
        </div>
      )}

      {/* Completed Events Section */}
      {completedEventsData.length > 0 && (
        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">Completed</h2>
          </div>
          <div className="events-grid">
            {completedEventsData.map(event => renderEventCard(event))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {overdueEventsData.length === 0 && upcomingEventsData.length === 0 && completedEventsData.length === 0 && (
        <div className="empty-state">
          <p>You haven't hosted any events yet.</p>
        </div>
      )}

      {/* Event Details Modal */}
      {detailsModalVisible && detailsModalEvent && (
        <div className="details-modal-overlay" onClick={handleCloseDetailsModal}>
          <div className="details-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="details-modal-header">
              <div className="details-modal-title-section">
                <h2 className="details-modal-title">Event Details</h2>
              </div>
              <button className="details-modal-close" onClick={handleCloseDetailsModal} title="Close">
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="details-modal-body">
              {/* Left Panel - Main Details */}
              <div className="details-main-panel">
                {isEditMode ? (
                  // Edit Mode
                  <>
                    <div className="details-section">
                      <h3 className="details-section-title">Edit Event Details</h3>
                      <div className="details-section-content">
                        <div className="edit-form">
                          <div className="edit-form-group">
                            <label className="edit-form-label">Title *</label>
                            <input
                              type="text"
                              className={`edit-form-input ${editFormErrors.title ? 'error' : ''}`}
                              value={editFormData.title}
                              onChange={(e) => handleEditFieldChange('title', e.target.value)}
                              placeholder="Event title"
                              maxLength={100}
                              required
                            />
                            {editFormErrors.title ? (
                              <span className="edit-form-error">{editFormErrors.title}</span>
                            ) : (
                              <span className="edit-form-helper">{editFormData.title.length}/100 characters</span>
                            )}
                          </div>

                          <div className="edit-form-group">
                            <label className="edit-form-label">Description *</label>
                            <textarea
                              className={`edit-form-textarea ${editFormErrors.description ? 'error' : ''}`}
                              value={editFormData.description}
                              onChange={(e) => handleEditFieldChange('description', e.target.value)}
                              placeholder="Event description"
                              rows={6}
                              maxLength={1000}
                              required
                            />
                            {editFormErrors.description ? (
                              <span className="edit-form-error">{editFormErrors.description}</span>
                            ) : (
                              <span className="edit-form-helper">{editFormData.description.length}/1000 characters</span>
                            )}
                          </div>

                          <div className="edit-form-group">
                            <label className="edit-form-label">Meeting Link</label>
                            <input
                              type="text"
                              className={`edit-form-input ${editFormErrors.meetingLink ? 'error' : ''}`}
                              value={editFormData.meetingLink}
                              onChange={(e) => handleEditFieldChange('meetingLink', e.target.value)}
                              placeholder="https://..."
                            />
                            {editFormErrors.meetingLink && (
                              <span className="edit-form-error">{editFormErrors.meetingLink}</span>
                            )}
                          </div>

                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div className="edit-form-row">
                              <div className="edit-form-group">
                                <label className="edit-form-label">Start Date & Time *</label>
                                <DateTimePicker
                                  value={editFormData.startTimestamp}
                                  onChange={(newValue) => handleEditFieldChange('startTimestamp', newValue)}
                                  format="DD/MM/YYYY hh:mm A"
                                  ampm={true}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: "outlined",
                                      className: `edit-form-datepicker ${editFormErrors.startTimestamp ? 'error' : ''}`,
                                      required: true,
                                      error: !!editFormErrors.startTimestamp
                                    },
                                    popper: {
                                      placement: 'bottom-start',
                                      sx: {
                                        zIndex: 2100
                                      }
                                    },
                                    actionBar: {
                                      actions: ['clear', 'cancel', 'accept']
                                    }
                                  }}
                                />
                                {editFormErrors.startTimestamp && (
                                  <span className="edit-form-error">{editFormErrors.startTimestamp}</span>
                                )}
                              </div>

                              <div className="edit-form-group">
                                <label className="edit-form-label">End Date & Time *</label>
                                <DateTimePicker
                                  value={editFormData.endTimestamp}
                                  onChange={(newValue) => handleEditFieldChange('endTimestamp', newValue)}
                                  minDateTime={editFormData.startTimestamp}
                                  format="DD/MM/YYYY hh:mm A"
                                  ampm={true}
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      variant: "outlined",
                                      className: `edit-form-datepicker ${editFormErrors.endTimestamp ? 'error' : ''}`,
                                      required: true,
                                      error: !!editFormErrors.endTimestamp
                                    },
                                    popper: {
                                      placement: 'bottom-start',
                                      sx: {
                                        zIndex: 2100
                                      }
                                    },
                                    actionBar: {
                                      actions: ['clear', 'cancel', 'accept']
                                    }
                                  }}
                                />
                                {editFormErrors.endTimestamp && (
                                  <span className="edit-form-error">{editFormErrors.endTimestamp}</span>
                                )}
                              </div>
                            </div>
                          </LocalizationProvider>

                          <div className="edit-form-group">
                            <label className="edit-form-checkbox-label">
                              <input
                                type="checkbox"
                                className="edit-form-checkbox"
                                checked={editFormData.isAcceptingParticipants}
                                onChange={(e) => handleEditFieldChange('isAcceptingParticipants', e.target.checked)}
                              />
                              <span>Accepting Participants</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // View Mode
                  <>
                <div className="details-section">
                  <div className="details-section-content">
                    <div className="details-title-container">
                      <h2 className="details-event-title">
                        {detailsModalEvent.title || detailsModalEvent.Title || detailsModalEvent.eventTitle || detailsModalEvent.name || detailsModalEvent.eventName || 'Untitled Event'}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3 className="details-section-title">Description</h3>
                  <div className="details-section-content">
                    <p className="details-description">
                      {detailsModalEvent.description || detailsModalEvent.Description || detailsModalEvent.eventDescription || 'No description available'}
                    </p>
                  </div>
                </div>

                {/* Event Image Attachment Section */}
                {(() => {
                  const eventImageBitCode = detailsModalEvent.EventImageBitCode || detailsModalEvent.eventImageBitCode;
                  
                  // Don't show attachment section if null or empty
                  if (!eventImageBitCode || eventImageBitCode.trim() === '') {
                    return null;
                  }

                  // Determine which image to show
                  let imageToShow;
                  if (eventImageBitCode === 'test') {
                    imageToShow = defaultEventImage;
                  } else {
                    imageToShow = eventImageBitCode;
                  }

                  return (
                    <div className="details-section">
                      <h3 className="details-section-title">Attachments</h3>
                      <div className="details-section-content">
                        <div className="attachment-list">
                          <button 
                            className="attachment-item"
                            onClick={() => handleViewAttachment(imageToShow, false)}
                            title="Click to view image in popup"
                          >
                            <svg className="attachment-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <div className="attachment-info">
                              <span className="attachment-name">Event Image</span>
                              <span className="attachment-type">Image • Click to view</span>
                            </div>
                          </button>
                          <button 
                            className="attachment-new-tab-btn"
                            onClick={() => handleViewAttachment(imageToShow, true)}
                            title="Open in new tab"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="details-section">
                  <h3 className="details-section-title">Event Details</h3>
                  <div className="details-section-content">
                    <div className="details-info-grid">
                      <div className="details-info-item">
                        <span className="details-info-label">Event Type</span>
                        <span className="details-info-value">
                          {(detailsModalEvent.IsPrivate || detailsModalEvent.isPrivate || detailsModalEvent.private) ? "Private" : "Public"}
                        </span>
                      </div>
                      <div className="details-info-item">
                        <span className="details-info-label">Total Participants</span>
                        <span className="details-info-value">
                          {getParticipantCount(detailsModalEvent)}
                        </span>
                      </div>
                      {detailsModalEvent.location || detailsModalEvent.Location && (
                        <div className="details-info-item">
                          <span className="details-info-label">Location</span>
                          <span className="details-info-value">
                            {detailsModalEvent.location || detailsModalEvent.Location || 'Not specified'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meeting Link - Always show for host, display NA if link is empty */}
                {(() => {
                  const meetingLink = detailsModalEvent.MeetingLink || detailsModalEvent.meetingLink || detailsModalEvent.meeting_link;
                  const hasValidLink = meetingLink && meetingLink.trim() !== '';
                  return (
                    <div className="details-section">
                      <h3 className="details-section-title">Meeting Link</h3>
                      <div className="details-section-content">
                        {hasValidLink ? (
                          <a 
                            href={meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="meeting-link"
                            style={{
                              color: '#0078d4',
                              textDecoration: 'none',
                              wordBreak: 'break-all',
                              fontSize: '14px'
                            }}
                          >
                            {meetingLink}
                          </a>
                        ) : (
                          <span style={{ color: '#666', fontSize: '14px' }}>NA</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Participants List */}
                {(() => {
                  const detailsParticipants = detailsModalEvent.Participants || detailsModalEvent.participants || [];
                  const acceptedDetailsParticipants = detailsParticipants.filter(p => {
                    const status = p.registrationStatus !== undefined ? p.registrationStatus : p.RegistrationStatus;
                    return status === 1;
                  });
                  return acceptedDetailsParticipants.length > 0 && (
                    <div className="details-section">
                      <h3 className="details-section-title">Participants</h3>
                      <div className="details-section-content">
                        <div className="details-participants-grid">
                          {acceptedDetailsParticipants.map((participant) => {
                            const participantId = participant.ParticipantId || participant.participantId || participant.id;
                            const participantName = participant.ParticipantName || participant.participantName || participant.name || "Unknown Participant";
                            const bgColor = participant.BackgroundColour || participant.Background || participant.backgroundColour || participant.background || "#9c27b0";
                            const fgColor = participant.ForegroundColour || participant.Foreground || participant.foregroundColour || participant.foreground || "#fff";
                            
                            return (
                              <div key={participantId} className="details-participant-card">
                                <span
                                  className="details-participant-avatar"
                                  style={{
                                    backgroundColor: bgColor,
                                    color: fgColor,
                                  }}
                                >
                                  {participantName ? participantName[0] : "?"}
                                </span>
                                <span className="details-participant-name">
                                  {participantName && participantName.length > 15 
                                    ? participantName.substring(0, 15) + "..."
                                    : participantName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                  </>
                )}
              </div>

              {/* Right Panel - Sidebar - Only show in view mode */}
              {!isEditMode && (
              <div className="details-sidebar-panel">
                <div className="details-sidebar-section">
                  <h3 className="details-sidebar-title">Schedule</h3>
                  <div className="details-sidebar-content">
                    <div className="details-schedule-item">
                      <span className="details-schedule-label">Start Date & Time</span>
                      <span className="details-schedule-value">
                        {detailsModalEvent.StartTimestamp || detailsModalEvent.startTimestamp || detailsModalEvent.startTime || detailsModalEvent.start_time
                          ? new Date(detailsModalEvent.StartTimestamp || detailsModalEvent.startTimestamp || detailsModalEvent.startTime || detailsModalEvent.start_time).toLocaleString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="details-schedule-item">
                      <span className="details-schedule-label">End Date & Time</span>
                      <span className="details-schedule-value">
                        {detailsModalEvent.EndTimestamp || detailsModalEvent.endTimestamp || detailsModalEvent.endTime || detailsModalEvent.end_time
                          ? new Date(detailsModalEvent.EndTimestamp || detailsModalEvent.endTimestamp || detailsModalEvent.endTime || detailsModalEvent.end_time).toLocaleString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : 'Not specified'}
                      </span>
                    </div>
                    <div className="details-schedule-item">
                      <span className="details-schedule-label">Duration</span>
                      <span className="details-schedule-value">
                        {(() => {
                          const start = detailsModalEvent.StartTimestamp || detailsModalEvent.startTimestamp || detailsModalEvent.startTime || detailsModalEvent.start_time;
                          const end = detailsModalEvent.EndTimestamp || detailsModalEvent.endTimestamp || detailsModalEvent.endTime || detailsModalEvent.end_time;
                          if (start && end) {
                            const duration = new Date(end) - new Date(start);
                            const hours = Math.floor(duration / (1000 * 60 * 60));
                            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                            return `${hours}h ${minutes}m`;
                          }
                          return 'Not specified';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-sidebar-section">
                  <h3 className="details-sidebar-title">Organizer</h3>
                  <div className="details-sidebar-content">
                    <div className="details-organizer-card">
                      <span
                        className="details-organizer-avatar"
                        style={{
                          backgroundColor: detailsModalEvent.OrganizerDetails?.BackgroundColour || detailsModalEvent.OrganizerDetails?.Background || detailsModalEvent.organizerDetails?.backgroundColour || detailsModalEvent.organizerDetails?.background || "#9c27b0",
                          color: detailsModalEvent.OrganizerDetails?.ForegroundColour || detailsModalEvent.OrganizerDetails?.Foreground || detailsModalEvent.organizerDetails?.foregroundColour || detailsModalEvent.organizerDetails?.foreground || "#fff",
                        }}
                      >
                        {(detailsModalEvent.OrganizerDetails?.OrganizerName || detailsModalEvent.organizerDetails?.organizerName || detailsModalEvent.organizerDetails?.name)
                          ? (detailsModalEvent.OrganizerDetails?.OrganizerName || detailsModalEvent.organizerDetails?.organizerName || detailsModalEvent.organizerDetails?.name)[0]
                          : "?"}
                      </span>
                      <div className="details-organizer-info">
                        <span className="details-organizer-name">
                          {detailsModalEvent.OrganizerDetails?.OrganizerName || detailsModalEvent.organizerDetails?.organizerName || detailsModalEvent.organizerDetails?.name || "Unknown Organizer"}
                        </span>
                        {(() => {
                          const designation = detailsModalEvent.OrganizerDetails?.OrganizerDesignation || detailsModalEvent.organizerDetails?.organizerDesignation;
                          const company = detailsModalEvent.OrganizerDetails?.Company || detailsModalEvent.organizerDetails?.company;
                          
                          if (designation && company) {
                            return (
                              <span className="details-organizer-role">
                                {designation}, {company}
                              </span>
                            );
                          } else if (designation) {
                            return (
                              <span className="details-organizer-role">
                                {designation}
                              </span>
                            );
                          } else if (company) {
                            return (
                              <span className="details-organizer-role">
                                {company}
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {detailsModalEvent.OrganizerDetails?.Email || detailsModalEvent.organizerDetails?.email && (
                          <span className="details-organizer-email">
                            {detailsModalEvent.OrganizerDetails?.Email || detailsModalEvent.organizerDetails?.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="details-modal-footer">
              {isEditMode ? (
                // Edit mode buttons
                <>
                  <button 
                    className="details-modal-cancel" 
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </button>
                  <button 
                    className="details-modal-save" 
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                // View mode buttons
                <>
                  {isDetailsEventUpcoming && (
                    <button 
                      className="details-modal-edit" 
                      onClick={handleEnterEditMode}
                    >
                      Edit Event
                    </button>
                  )}
                  {isDetailsEventOverdue && (
                    <button 
                      className="details-modal-mark-complete" 
                      onClick={handleMarkAsComplete}
                      disabled={isMarkingComplete}
                    >
                      {isMarkingComplete ? 'Marking...' : 'Mark as Complete'}
                    </button>
                  )}
                  <button className="details-modal-cancel" onClick={handleCloseDetailsModal}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewerVisible && selectedImage && (
        <ImageViewer 
          imageUrl={selectedImage} 
          alt="Event image" 
          onClose={handleCloseImageViewer} 
        />
      )}

    </div>
  );
};

export default MyEvents;
