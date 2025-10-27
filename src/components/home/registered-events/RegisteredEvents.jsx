import React, { useState, useEffect } from "react";
import "./RegisteredEvents.css";
import { useApiService } from "../../../services/apiService";
import { useApp } from "../../../context/AppContext";

const RegisteredEvents = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);
  const [applyingEventId, setApplyingEventId] = useState(null);

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

  // Get current user's participant status for an event
  const getUserParticipantStatus = (event) => {
    if (!currentUser || !event.participants || event.participants.length === 0) {
      return null;
    }

    const userId = currentUser.userId || currentUser._id || currentUser.Id;
    if (!userId) {
      return null;
    }

    const participant = event.participants.find(p => 
      (p.participantId === userId) || (p.ParticipantId === userId)
    );

    if (!participant) {
      return null;
    }

    // Get registration status (number) and map to string
    const registrationStatus = participant.registrationStatus !== undefined 
      ? participant.registrationStatus 
      : participant.RegistrationStatus;

    // Convert to number to handle both string and number types
    const statusNum = Number(registrationStatus);

    // Map numeric status to string:
    // 0 = Requested (Pending)
    // 1 = Joined (Accepted/Upcoming)
    // -1 = Declined
    if (statusNum === 1) {
      return "Joined";
    } else if (statusNum === 0) {
      return "Requested";
    } else if (statusNum === -1) {
      return "Declined";
    }

    return null;
  };

  // Split events into Upcoming (Joined), Pending (Requested), and Rejected (Declined)
  const upcomingEvents = eventsData.filter(event => {
    const status = getUserParticipantStatus(event);
    return status === "Joined";
  });

  const pendingEvents = eventsData.filter(event => {
    const status = getUserParticipantStatus(event);
    return status === "Requested";
  });

  const rejectedEvents = eventsData.filter(event => {
    const status = getUserParticipantStatus(event);
    return status === "Declined";
  });

  // Refresh events data
  const refreshEvents = async () => {
    if (!currentUser) return;

    try {
      setError(null);
      const userId = currentUser.userId || currentUser._id || currentUser.Id;
      const events = await apiService.getRegisteredEvents(userId);
      const eventsArray = Array.isArray(events) ? events : [events];
      const sortedEvents = sortEventsByStartTime(eventsArray);
      setEventsData(sortedEvents);
      
      // If modal is open, update the modal event data as well
      if (detailsModalEvent) {
        const modalEventId = detailsModalEvent.eventId || detailsModalEvent.EventId || detailsModalEvent.id || detailsModalEvent._id;
        const updatedEvent = sortedEvents.find(event => {
          const eventId = event.eventId || event.EventId || event.id || event._id;
          return eventId === modalEventId;
        });
        if (updatedEvent) {
          setDetailsModalEvent(updatedEvent);
        }
      }
    } catch (err) {
      console.error('Failed to refresh events:', err);
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
        const events = await apiService.getRegisteredEvents(userId);
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
  }, [currentUser]); // Reload when user changes

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

  // Handle apply/register button click
  const handleApplyToEvent = async (event) => {
    if (!currentUser) {
      window.dispatchEvent(new CustomEvent('api:notify', { 
        detail: { type: 'error', message: 'Please login to apply to events' } 
      }));
      return;
    }

    const userId = currentUser.userId || currentUser._id || currentUser.Id;
    if (!userId) {
      window.dispatchEvent(new CustomEvent('api:notify', { 
        detail: { type: 'error', message: 'User ID not found' } 
      }));
      return;
    }

    const eventId = event.eventId || event.EventId || event.id || event._id;
    if (!eventId) {
      window.dispatchEvent(new CustomEvent('api:notify', { 
        detail: { type: 'error', message: 'Invalid event ID' } 
      }));
      return;
    }

    try {
      setApplyingEventId(eventId);
      await apiService.applyToEvent(eventId, userId);
      await refreshEvents();
    } catch (err) {
      console.error('Failed to apply to event:', err);
    } finally {
      setApplyingEventId(null);
    }
  };

  // Check if current user is already registered for the event
  const isUserRegistered = (event) => {
    if (!currentUser || !event.participants || event.participants.length === 0) {
      return false;
    }

    const userId = currentUser.userId || currentUser._id || currentUser.Id;
    if (!userId) {
      return false;
    }

    return event.participants.some(participant => 
      participant.participantId === userId || 
      participant.ParticipantId === userId
    );
  };

  // Get user's registration status for the event
  const getUserRegistrationStatus = (event) => {
    if (!currentUser || !event.participants || event.participants.length === 0) {
      return null;
    }

    const userId = currentUser.userId || currentUser._id || currentUser.Id;
    if (!userId) {
      return null;
    }

    const participant = event.participants.find(p => 
      (p.participantId === userId) || (p.ParticipantId === userId)
    );

    if (!participant) {
      return null;
    }

    const registrationStatus = participant.registrationStatus !== undefined ? participant.registrationStatus : participant.RegistrationStatus;
    // Convert to number to handle both string and number types
    return registrationStatus !== undefined && registrationStatus !== null ? Number(registrationStatus) : null;
  };

  // Get button text based on event type and registration status
  const getButtonText = (event, isRegistered) => {
    const isPrivate = event.IsPrivate || event.isPrivate || event.private;
    const registrationStatus = getUserRegistrationStatus(event);
    
    if (isRegistered) {
      if (registrationStatus === -1) {
        return "Declined";
      } else if (registrationStatus === 1) {
        return "Joined";
      } else if (registrationStatus === 0) {
        return "Requested";
      }
    }
    
    return isPrivate ? "Request" : "Join";
  };

  // Check if user's registration was declined
  const isRegistrationDeclined = (event) => {
    if (!event.IsPrivate && !event.isPrivate && !event.private) {
      return false;
    }
    
    const registrationStatus = getUserRegistrationStatus(event);
    return registrationStatus === -1;
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
            <div className="schedule-label">Scheduled on:</div>
            <div className="schedule-date">{date}</div>
            <div className="schedule-time">{timeRange}</div>
          </div>
          
          <div className="event-actions">
            <button className="view-details-button" onClick={() => handleViewDetails(event)}>
              View Details
            </button>
            {(() => {
              const registered = isUserRegistered(event);
              const declined = isRegistrationDeclined(event);
              const eventId = event.eventId || event.EventId || event.id || event._id;
              const isApplying = applyingEventId === eventId;
              const buttonText = isApplying ? "Applying..." : getButtonText(event, registered);
              
              let statusClass = '';
              if (!isApplying) {
                if (buttonText === 'Joined') {
                  statusClass = 'joined';
                } else if (buttonText === 'Requested') {
                  statusClass = 'requested';
                } else if (buttonText === 'Declined') {
                  statusClass = 'declined';
                }
              }
              
              return (
                <button 
                  className={`apply-button ${registered ? 'registered' : ''} ${statusClass}`}
                  onClick={() => handleApplyToEvent(event)}
                  disabled={registered || isApplying}
                >
                  {buttonText}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="registered-events-container">
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
      <div className="registered-events-container">
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
    <div className="registered-events-container">
      {/* Header */}
      <div className="registered-events-header">
        <h1>Registered Events</h1>
        <p>View all events you have joined or requested to join</p>
      </div>

      {/* Upcoming Events Section (Joined) */}
      {upcomingEvents.length > 0 && (
        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming</h2>
          </div>
          <div className="events-grid">
            {upcomingEvents.map(event => renderEventCard(event))}
          </div>
        </div>
      )}

      {/* Pending Events Section (Requested) */}
      {pendingEvents.length > 0 && (
        <div className="events-section events-section-pending">
          <div className="section-header">
            <h2 className="section-title">Pending</h2>
          </div>
          <div className="events-grid">
            {pendingEvents.map(event => renderEventCard(event))}
          </div>
        </div>
      )}

      {/* Rejected Events Section (Declined) */}
      {rejectedEvents.length > 0 && (
        <div className="events-section events-section-rejected">
          <div className="section-header">
            <h2 className="section-title">Rejected Requests</h2>
          </div>
          <div className="events-grid">
            {rejectedEvents.map(event => renderEventCard(event))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcomingEvents.length === 0 && pendingEvents.length === 0 && rejectedEvents.length === 0 && (
        <div className="empty-state">
          <p>You haven't registered for any events yet.</p>
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
              <h3>Participants ({(() => {
                // Use totalRegisteredParticipants if available, otherwise filter and count accepted participants
                const total = selectedEvent.TotalRegisteredParticipants || selectedEvent.totalRegisteredParticipants;
                if (total !== undefined && total !== null) {
                  return total;
                }
                // Fallback: count only accepted participants (status === 1)
                const participants = selectedEvent.Participants || selectedEvent.participants || [];
                return participants.filter(p => {
                  const status = p.registrationStatus !== undefined ? p.registrationStatus : p.RegistrationStatus;
                  return status === 1;
                }).length;
              })()})</h3>
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
                          {(() => {
                            // Use totalRegisteredParticipants if available, otherwise filter and count accepted participants
                            const total = detailsModalEvent.totalRegisteredParticipants || detailsModalEvent.TotalRegisteredParticipants;
                            if (total !== undefined && total !== null) {
                              return total;
                            }
                            // Fallback: count only accepted participants (status === 1)
                            const participants = detailsModalEvent.Participants || detailsModalEvent.participants || [];
                            return participants.filter(p => {
                              const status = p.registrationStatus !== undefined ? p.registrationStatus : p.RegistrationStatus;
                              return status === 1;
                            }).length;
                          })()}
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

                {/* Meeting Link - Show for registered users (status = 1), display NA if link is empty */}
                {(() => {
                  const registrationStatus = getUserRegistrationStatus(detailsModalEvent);
                  if (registrationStatus === 1) {
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
                  }
                  return null;
                })()}

                {/* Participants List - Show for both public events and private events where user is accepted (status = 1) */}
                {(() => {
                  const isPrivate = detailsModalEvent.IsPrivate || detailsModalEvent.isPrivate || detailsModalEvent.private;
                  const registrationStatus = getUserRegistrationStatus(detailsModalEvent);
                  const shouldShowParticipants = !isPrivate || registrationStatus === 1;
                  
                  if (!shouldShowParticipants) {
                    return null;
                  }
                  
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
              {detailsModalEvent && (() => {
                const registered = isUserRegistered(detailsModalEvent);
                const eventId = detailsModalEvent.eventId || detailsModalEvent.EventId || detailsModalEvent.id || detailsModalEvent._id;
                const isApplying = applyingEventId === eventId;
                const isPrivate = detailsModalEvent.IsPrivate || detailsModalEvent.isPrivate || detailsModalEvent.private;
                const registrationStatus = getUserRegistrationStatus(detailsModalEvent);
                
                let buttonText;
                if (isApplying) {
                  buttonText = "Applying...";
                } else if (registered) {
                  if (registrationStatus === -1) {
                    buttonText = "Declined";
                  } else if (registrationStatus === 1) {
                    buttonText = "Joined";
                  } else if (registrationStatus === 0) {
                    buttonText = "Requested";
                  } else {
                    buttonText = isPrivate ? "Requested" : "Joined";
                  }
                } else {
                  buttonText = isPrivate ? "Request to Join" : "Join Event";
                }
                
                let statusClass = '';
                if (!isApplying && registered) {
                  if (buttonText === 'Joined') {
                    statusClass = 'joined';
                  } else if (buttonText === 'Requested') {
                    statusClass = 'requested';
                  } else if (buttonText === 'Declined') {
                    statusClass = 'declined';
                  }
                }
                
                return (
                  <button 
                    className={`details-modal-action ${registered ? 'registered' : ''} ${statusClass}`}
                    onClick={() => {
                      if (detailsModalEvent) {
                        handleApplyToEvent(detailsModalEvent);
                      }
                    }}
                    disabled={registered || isApplying}
                  >
                    {buttonText}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RegisteredEvents;
