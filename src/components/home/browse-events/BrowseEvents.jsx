import React, { useState, useEffect } from "react";
import "./BrowseEvents.css";
import { useApiService } from "../../../services/apiService";

const BrowseEvents = () => {
  const [search, setSearch] = useState("");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiService = useApiService();

  // Load events data from API on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const events = await apiService.getBrowseUpcomingEvents();
        const eventsArray = Array.isArray(events) ? events : [events];
        setEventsData(eventsArray);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err.message || 'Failed to load events');
        setEventsData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []); // Empty dependency array to run only once on mount

  // Filter events by title
  const filteredEvents = eventsData.length > 0 ? eventsData.filter((event) => {
    if (!event) {
      return false;
    }
    
    // Try different possible property names for title
    const title = event.Title || event.title || event.eventTitle || event.name || event.eventName;
    
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
                     <h2 className="event-title">{event.Title || event.title || event.eventTitle || event.name || event.eventName || 'Untitled Event'}</h2>
                   </div>
                   <p className="event-description">{event.Description || event.description || event.eventDescription || 'No description available'}</p>
                  <div 
                    className={`participants-badge ${!(event.IsPrivate || event.isPrivate || event.private) ? 'clickable' : ''}`}
                    onClick={!(event.IsPrivate || event.isPrivate || event.private) ? (e) => handleParticipantsClick(event, e.currentTarget) : undefined}
                  >
                    Total Participants : {event.TotalRegisteredParticipants || event.Participants?.length || 0}
                  </div>
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
                   
                   {(event.IsPrivate || event.isPrivate || event.private) && (
                     <div className="private-indicator">
                       <span className="lock-icon">🔒</span>
                       <span className="private-text">Private</span>
                     </div>
                   )}
                   
                   <button className="apply-button">
                     {(event.IsPrivate || event.isPrivate || event.private) ? "Request" : "Join"}
                   </button>
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
              <h3>Participants ({selectedEvent.TotalRegisteredParticipants || selectedEvent.Participants?.length || 0})</h3>
              <button className="popover-close" onClick={handleClosePopover}>×</button>
            </div>
            <div className="participants-list">
              {selectedEvent.Participants && selectedEvent.Participants.length > 0 ? (
                selectedEvent.Participants.map((participant) => (
                  <div key={participant.ParticipantId} className="participant-item">
                    <span
                      className="participant-avatar"
                      style={{
                        backgroundColor: participant.BackgroundColour || participant.Background || "#9c27b0",
                        color: participant.ForegroundColour || participant.Foreground || "#fff",
                      }}
                    >
                      {participant.ParticipantName ? participant.ParticipantName[0] : "?"}
                    </span>
                    <span className="participant-name">
                      {participant.ParticipantName && participant.ParticipantName.length > 22 
                        ? participant.ParticipantName.substring(0, 22) + ".."
                        : participant.ParticipantName || "Unknown Participant"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="no-participants">No participants registered</div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default BrowseEvents;
