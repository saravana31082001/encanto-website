import React, { useState, useEffect } from "react";
import "./EventHistory.css";
import { useApiService } from "../../../services/apiService";
import { useApp } from "../../../context/AppContext";
import ImageViewer from "../../common/ImageViewer";
import defaultEventImage from "../../../assets/SVG/JPG/sample_image.jpg";

const EventHistory = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const apiService = useApiService();
  const { user: currentUser } = useApp();

  // Helper function to sort events by start time (most recent first for history)
  const sortEventsByStartTime = (events) => {
    return events.sort((a, b) => {
      const startTimeA = a.StartTimestamp || a.startTimestamp || a.startTime || a.start_time;
      const startTimeB = b.StartTimestamp || b.startTimestamp || b.startTime || b.start_time;
      
      if (!startTimeA && !startTimeB) return 0;
      if (!startTimeA) return 1;
      if (!startTimeB) return -1;
      
      // For history, show most recent first (reverse order)
      return new Date(startTimeB) - new Date(startTimeA);
    });
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
        const events = await apiService.getPastAttendedEvents(userId);
        const eventsArray = Array.isArray(events) ? events : [events];
        const sortedEvents = sortEventsByStartTime(eventsArray);
        setEventsData(sortedEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err.message || 'Failed to load events');
        setEventsData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Ensure we have a valid events array
  const safeEventsData = Array.isArray(eventsData) ? eventsData : [];

  // Handle popover toggle
  const handleParticipantsClick = (event, eventElement) => {
    const rect = eventElement.getBoundingClientRect();
    setPopoverPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX
    });
    setSelectedEvent(event);
    setPopoverVisible(true);
  };

  // Close popover when clicking outside
  const handleClosePopover = () => {
    setPopoverVisible(false);
    setSelectedEvent(null);
  };

  // Handle details modal
  const handleViewDetails = (event) => {
    setDetailsModalEvent(event);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setDetailsModalEvent(null);
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
  const renderEventCard = (event) => {
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
          <div className="organizer-info">
            <span
              className="organizer-avatar"
              style={{
                backgroundColor:
                  event.OrganizerDetails?.BackgroundColour || event.OrganizerDetails?.Background || event.organizerDetails?.backgroundColour || event.organizerDetails?.background || "#9c27b0",
                color: event.OrganizerDetails?.ForegroundColour || event.OrganizerDetails?.Foreground || event.organizerDetails?.foregroundColour || event.organizerDetails?.foreground || "#fff",
              }}
            >
              {(event.OrganizerDetails?.OrganizerName || event.organizerDetails?.organizerName || event.organizerDetails?.name)
                ? (event.OrganizerDetails?.OrganizerName || event.organizerDetails?.organizerName || event.organizerDetails?.name)[0]
                : "?"}
            </span>
            <span className="organizer-name">
              {(() => {
                const organizerName = event.OrganizerDetails?.OrganizerName || event.organizerDetails?.organizerName || event.organizerDetails?.name;
                return organizerName && organizerName.length > 12
                  ? organizerName.substring(0, 12) + ".."
                  : organizerName || "Unknown Organizer";
              })()}
            </span>
          </div>
          
          <div className="schedule-info">
            <div className="schedule-label">Attended on:</div>
            <div className="schedule-date">{date}</div>
            <div className="schedule-time">{timeRange}</div>
          </div>
          
          <div className="event-actions">
            <button className="view-details-button" onClick={() => handleViewDetails(event)}>
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
      <div className="event-history-container">
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
      <div className="event-history-container">
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
    <div className="event-history-container">
      {/* Header */}
      <div className="event-history-header">
        <h1>Event History</h1>
        <p>View all events you have attended in the past</p>
      </div>

      {/* Events Grid */}
      {safeEventsData.length > 0 ? (
        <div className="events-grid">
          {safeEventsData.map(event => renderEventCard(event))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't attended any events yet.</p>
        </div>
      )}

      {/* Participants Popover */}
      {popoverVisible && selectedEvent && (
        <>
          <div className="popover-overlay" onClick={handleClosePopover}></div>
          <div 
            className="popover-content tooltip-style" 
            style={{
              top: popoverPosition.top,
              left: popoverPosition.left
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popover-header">
              <h3>Participants ({selectedEvent.TotalRegisteredParticipants || selectedEvent.totalRegisteredParticipants || (selectedEvent.Participants || selectedEvent.participants || []).length})</h3>
              <button className="popover-close" onClick={handleClosePopover}>×</button>
            </div>
            <div className="participants-list">
              {(() => {
                const participants = selectedEvent.Participants || selectedEvent.participants || [];
                const acceptedParticipants = participants.filter(p => {
                  const status = p.registrationStatus !== undefined ? p.registrationStatus : p.RegistrationStatus;
                  return status === 1;
                });
                return acceptedParticipants.length > 0 ? (
                  acceptedParticipants.map((participant) => {
                    const participantId = participant.ParticipantId || participant.participantId || participant.id;
                    const participantName = participant.ParticipantName || participant.participantName || participant.name || "Unknown Participant";
                    const bgColor = participant.BackgroundColour || participant.Background || participant.backgroundColour || participant.background || "#9c27b0";
                    const fgColor = participant.ForegroundColour || participant.Foreground || participant.foregroundColour || participant.foreground || "#fff";
                    
                    return (
                      <div key={participantId} className="participant-item">
                        <span
                          className="participant-avatar"
                          style={{
                            backgroundColor: bgColor,
                            color: fgColor,
                          }}
                        >
                          {participantName ? participantName[0] : "?"}
                        </span>
                        <span className="participant-name">
                          {participantName && participantName.length > 15 
                            ? participantName.substring(0, 15) + "..."
                            : participantName}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-participants">No participants registered</div>
                );
              })()}
            </div>
          </div>
        </>
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
                          {detailsModalEvent.totalRegisteredParticipants || detailsModalEvent.TotalRegisteredParticipants || (detailsModalEvent.Participants || detailsModalEvent.participants || []).length}
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

                {!(detailsModalEvent.IsPrivate || detailsModalEvent.isPrivate || detailsModalEvent.private) && 
                 (() => {
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
              </div>

              {/* Right Panel - Sidebar */}
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
            </div>

            {/* Modal Footer */}
            <div className="details-modal-footer">
              <button className="details-modal-cancel" onClick={handleCloseDetailsModal}>
                Close
              </button>
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

export default EventHistory;
