import React, { useState, useEffect } from "react";
import "./MyEvents.css";
import { useApiService } from "../../../services/apiService";
import { useApp } from "../../../context/AppContext";

const MyEvents = () => {
  const [overdueEventsData, setOverdueEventsData] = useState([]);
  const [upcomingEventsData, setUpcomingEventsData] = useState([]);
  const [completedEventsData, setCompletedEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsModalEvent, setDetailsModalEvent] = useState(null);
  const [isDetailsEventOverdue, setIsDetailsEventOverdue] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

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
  const handleViewDetails = (event) => {
    // Check if this event is overdue
    const now = new Date();
    const endTime = event.EndTimestamp || event.endTimestamp || event.endTime || event.end_time;
    const active = event.Active !== undefined ? event.Active : event.active;
    const isOverdue = active === 1 && endTime && new Date(endTime) < now;
    
    setDetailsModalEvent(event);
    setIsDetailsEventOverdue(isOverdue);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setDetailsModalEvent(null);
    setIsDetailsEventOverdue(false);
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
            {upcomingEventsData.map(event => renderEventCard(event))}
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

                {/* Meeting Link - Always show for host */}
                {(() => {
                  const meetingLink = detailsModalEvent.MeetingLink || detailsModalEvent.meetingLink || detailsModalEvent.meeting_link;
                  return meetingLink && meetingLink.trim() !== '' && (
                    <div className="details-section">
                      <h3 className="details-section-title">Meeting Link</h3>
                      <div className="details-section-content">
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
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyEvents;
