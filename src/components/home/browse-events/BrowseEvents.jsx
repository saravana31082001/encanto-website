import React, { useState, useEffect } from "react";
import "./BrowseEvents.css";
import { useApiService } from "../../../services/apiService";
import { useApp } from "../../../context/AppContext";
import { 
  startConnection, 
  stopConnection, 
  subscribeToEventChanges, 
  unsubscribeFromEventChanges,
  getConnectionState 
} from "../../../signalrConnection";

const BrowseEvents = () => {
  const [search, setSearch] = useState("");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
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

  // Helper function to insert event in correct chronological order
  const insertEventInOrder = (events, newEvent) => {
    const newEvents = [...events, newEvent];
    return sortEventsByStartTime(newEvents);
  };

  // Refresh events data (used after applying to an event)
  const refreshEvents = async () => {
    try {
      setError(null);
      const events = await apiService.getBrowseUpcomingEvents();
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
      // Don't set error state on refresh to avoid disrupting UI
    }
  };

  // Load events data from API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const events = await apiService.getBrowseUpcomingEvents();
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
  }, []); // Run only once on component mount

  // SignalR connection and real-time updates
  useEffect(() => {
    let isMounted = true;
    let connectionInitialized = false;

    const initializeSignalR = async () => {
      try {
        // Only start if component is still mounted and connection not already initialized
        if (!isMounted || connectionInitialized) return;
        
        await startConnection();
        connectionInitialized = true;
        
        if (isMounted) {
          setConnectionStatus("Connected");
        }

        // Subscribe to EventChanged messages
        subscribeToEventChanges((message) => {
          if (!isMounted) return;

          console.log('Received real-time event update:', message);
          
          // Handle both capitalized and lowercase property names
          const action = message.Action || message.action;
          const event = message.Event || message.event;
          
          if (!action || !event) {
            console.warn('Invalid message format:', message);
            return;
          }
          
          setEventsData(prevEvents => {
            try {
              // Use eventId as the primary key (as specified in your message structure)
              const eventId = event.eventId;
              
              if (!eventId) {
                console.warn('Event missing eventId:', event);
                return prevEvents;
              }
              
              switch (action) {
                case 'create':
                  // Add new event to the list in correct chronological order
                  return insertEventInOrder(prevEvents, event);
                  
                case 'update':
                  // Update existing event and maintain chronological order
                  const updatedEvents = prevEvents.map(prevEvent => {
                    const currentEventId = prevEvent.eventId;
                    return currentEventId === eventId ? event : prevEvent;
                  });
                  return sortEventsByStartTime(updatedEvents);
                  
                case 'delete':
                  // Remove event from the list
                  return prevEvents.filter(prevEvent => {
                    const currentEventId = prevEvent.eventId;
                    return currentEventId !== eventId;
                  });
                  
                default:
                  console.warn('Unknown action received:', action);
                  return prevEvents;
              }
            } catch (error) {
              console.error('Error processing real-time update:', error);
              return prevEvents; // Return unchanged state on error
            }
          });
        });

      } catch (error) {
        console.error('Failed to initialize SignalR:', error);
        if (isMounted) {
          setConnectionStatus("Disconnected");
        }
      }
    };

    // Monitor connection status
    const statusInterval = setInterval(() => {
      if (isMounted) {
        const state = getConnectionState();
        setConnectionStatus(state.isConnected ? "Connected" : "Disconnected");
      }
    }, 1000);

    // Initialize SignalR with a small delay to avoid race conditions
    const initTimeout = setTimeout(() => {
      initializeSignalR();
    }, 100);

    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      clearInterval(statusInterval);
      
      // Only cleanup if we actually initialized the connection
      if (connectionInitialized) {
        unsubscribeFromEventChanges();
        stopConnection().catch(console.error);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Ensure we have a valid events array to prevent blank screen
  const safeEventsData = Array.isArray(eventsData) ? eventsData : [];

  // Filter events by title
  const filteredEvents = safeEventsData.length > 0 ? safeEventsData.filter((event) => {
    if (!event) {
      return false;
    }
    
    // Try different possible property names for title (prioritize lowercase 'title' from your message structure)
    const title = event.title || event.Title || event.eventTitle || event.name || event.eventName;
    
    if (!title) {
      return false;
    }
    
    return title.toLowerCase().includes(search.toLowerCase());
  }) : [];

  // Handle popover toggle
  const handleParticipantsClick = (event, eventElement) => {
    const rect = eventElement.getBoundingClientRect();
    setPopoverPosition({
      top: rect.bottom + window.scrollY + 8, // 8px gap below the badge
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
      // Refresh events to show updated participant list
      await refreshEvents();
    } catch (err) {
      console.error('Failed to apply to event:', err);
      // Error is already handled by the API service
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

  // Get user's registration status for the event (null if not registered, status number if registered)
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

    return participant ? (participant.registrationStatus !== undefined ? participant.registrationStatus : participant.RegistrationStatus) : null;
  };

  // Get button text based on event type and registration status
  const getButtonText = (event, isRegistered) => {
    const isPrivate = event.IsPrivate || event.isPrivate || event.private;
    const registrationStatus = getUserRegistrationStatus(event);
    
    // If user is already registered, show their registration status
    if (isRegistered) {
      if (registrationStatus === -1) {
        return "Declined";
      } else if (registrationStatus === 1) {
        return "Joined";
      } else if (registrationStatus === 0) {
        return "Requested";
      }
    }
    
    // Only check if accepting participants when user hasn't registered yet
    const isAcceptingParticipants = event.is_accepting_participants !== undefined 
      ? event.is_accepting_participants 
      : event.IsAcceptingParticipants !== undefined 
        ? event.IsAcceptingParticipants 
        : true; // default to true if not specified
    
    if (!isAcceptingParticipants) {
      return "Closed";
    }
    
    return isPrivate ? "Request" : "Join";
  };

  // Check if user's registration was declined
  const isRegistrationDeclined = (event) => {
    if (!event.IsPrivate && !event.isPrivate && !event.private) {
      return false; // Only applies to private events
    }
    
    const registrationStatus = getUserRegistrationStatus(event);
    return registrationStatus === -1;
  };

  // Format schedule (date + start–end time)
  const formatSchedule = (start, end) => {
    if (!start || !end) return { date: "", timeRange: "" };

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Format date as "19 Sept, 2025"
    const date = startDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Format time as "04:30 pm - 08:45 pm"
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

  // Show loading state
  if (loading) {
    return (
      <div className="browse-events-container">
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
      <div className="browse-events-container">
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
    <div className="browse-events-container">
      {/* Header with gradient line */}
      <div className="browse-events-header">
        <h1>Browse Events</h1>
        <p>Discover and join exciting events happening around you</p>
      </div>

      {/* Connection Status - Only show in development mode (localhost) */}
      {window.location.hostname === 'localhost' && false &&(
        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus.toLowerCase()}`}>
            <span className="status-dot"></span>
            <span className="status-text">Real-time: {connectionStatus}</span>
          </div>
        </div>
      )}

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {/* Events grid */}
      <div className="events-grid">
        {!loading && !error && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            if (!event) {
              return null;
            }
            
            const eventId = event.EventId || event.eventId || event.id || event._id;
            if (!eventId) {
              return null;
            }
            
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
                      
                      // Only check if event is accepting participants when user is not registered
                      const isAcceptingParticipants = registered ? true : (
                        event.is_accepting_participants !== undefined 
                          ? event.is_accepting_participants 
                          : event.IsAcceptingParticipants !== undefined 
                            ? event.IsAcceptingParticipants 
                            : true
                      );
                      
                      // Determine status class based on button text
                      let statusClass = '';
                      if (!isApplying) {
                        if (buttonText === 'Joined') {
                          statusClass = 'joined';
                        } else if (buttonText === 'Requested') {
                          statusClass = 'requested';
                        } else if (buttonText === 'Declined') {
                          statusClass = 'declined';
                        } else if (buttonText === 'Closed') {
                          statusClass = 'closed';
                        }
                      }
                      
                      return (
                        <button 
                          className={`apply-button ${registered ? 'registered' : ''} ${statusClass}`}
                          onClick={() => handleApplyToEvent(event)}
                          disabled={registered || isApplying || !isAcceptingParticipants}
                        >
                          {buttonText}
                        </button>
                      );
                    })()}
                   </div>
                 </div>
              </div>
            );
          })
        ) : !loading && !error ? (
          <p>No events found</p>
        ) : null}
      </div>

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

      {/* Event Details Modal - Azure DevOps Style */}
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
              {detailsModalEvent && (() => {
                const registered = isUserRegistered(detailsModalEvent);
                const eventId = detailsModalEvent.eventId || detailsModalEvent.EventId || detailsModalEvent.id || detailsModalEvent._id;
                const isApplying = applyingEventId === eventId;
                const isPrivate = detailsModalEvent.IsPrivate || detailsModalEvent.isPrivate || detailsModalEvent.private;
                const registrationStatus = getUserRegistrationStatus(detailsModalEvent);
                
                let buttonText;
                let isAcceptingParticipants = true;
                
                if (isApplying) {
                  buttonText = "Applying...";
                } else if (registered) {
                  // If user is already registered, show their registration status
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
                  // Only check if accepting participants when user hasn't registered yet
                  isAcceptingParticipants = detailsModalEvent.is_accepting_participants !== undefined 
                    ? detailsModalEvent.is_accepting_participants 
                    : detailsModalEvent.IsAcceptingParticipants !== undefined 
                      ? detailsModalEvent.IsAcceptingParticipants 
                      : true;
                  
                  if (!isAcceptingParticipants) {
                    buttonText = "Closed";
                  } else {
                    buttonText = isPrivate ? "Request to Join" : "Join Event";
                  }
                }
                
                // Determine status class based on button text
                let statusClass = '';
                if (!isApplying) {
                  if (buttonText === 'Joined') {
                    statusClass = 'joined';
                  } else if (buttonText === 'Requested') {
                    statusClass = 'requested';
                  } else if (buttonText === 'Declined') {
                    statusClass = 'declined';
                  } else if (buttonText === 'Closed') {
                    statusClass = 'closed';
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
                    disabled={registered || isApplying || !isAcceptingParticipants}
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

export default BrowseEvents;
