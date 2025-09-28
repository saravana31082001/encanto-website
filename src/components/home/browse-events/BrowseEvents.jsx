import React, { useState } from "react";
import "./BrowseEvents.css";
import eventsJson from "../../../assets/JsonData/Events.json"; // ✅ direct import

const BrowseEvents = () => {
  const [search, setSearch] = useState("");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // Ensure JSON is always an array
  const eventsData = Array.isArray(eventsJson) ? eventsJson : [eventsJson];

  // Filter events by title
  const filteredEvents = eventsData.filter((event) =>
    event.Title.toLowerCase().includes(search.toLowerCase())
  );

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
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const { date, timeRange } = formatSchedule(
              event.StartTimestamp,
              event.EndTimestamp
            );
            return (
              <div key={event.EventId} className="event-card">
                {/* Left Section - Event Details */}
                 <div className="event-left-section">
                   <div className="event-header">
                     <h2 className="event-title">{event.Title}</h2>
                   </div>
                   <p className="event-description">{event.Description}</p>
                  <div 
                    className={`participants-badge ${!event.IsPrivate ? 'clickable' : ''}`}
                    onClick={!event.IsPrivate ? (e) => handleParticipantsClick(event, e.currentTarget) : undefined}
                  >
                    Total Participants : {event.Participants?.length || 0}
                  </div>
                </div>

                 {/* Right Section - Organizer and Schedule */}
                 <div className="event-right-section">
                   <div className="organizer-info">
                     <span
                       className="organizer-avatar"
                       style={{
                         backgroundColor:
                           event.OrganizerDetails?.Background || "#9c27b0",
                         color: event.OrganizerDetails?.Foreground || "#fff",
                       }}
                     >
                       {event.OrganizerDetails?.OrganizerName
                         ? event.OrganizerDetails.OrganizerName[0]
                         : "?"}
                     </span>
                     <span className="organizer-name">
                       {event.OrganizerDetails?.OrganizerName && event.OrganizerDetails.OrganizerName.length > 12
                         ? event.OrganizerDetails.OrganizerName.substring(0, 12) + ".."
                         : event.OrganizerDetails?.OrganizerName || "Unknown Organizer"}
                     </span>
                   </div>
                   
                   <div className="schedule-info">
                     <div className="schedule-label">Scheduled on:</div>
                     <div className="schedule-date">{date}</div>
                     <div className="schedule-time">{timeRange}</div>
                   </div>
                   
                   {event.IsPrivate && (
                     <div className="private-indicator">
                       <span className="lock-icon">🔒</span>
                       <span className="private-text">Private</span>
                     </div>
                   )}
                   
                   <button className="apply-button">
                     {event.IsPrivate ? "Request" : "Join"}
                   </button>
                 </div>
              </div>
            );
          })
        ) : (
          <p>No events found</p>
        )}
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
              <h3>Participants ({selectedEvent.Participants?.length || 0})</h3>
              <button className="popover-close" onClick={handleClosePopover}>×</button>
            </div>
            <div className="participants-list">
              {selectedEvent.Participants && selectedEvent.Participants.length > 0 ? (
                selectedEvent.Participants.map((participant) => (
                  <div key={participant.ParticipantId} className="participant-item">
                    <span
                      className="participant-avatar"
                      style={{
                        backgroundColor: participant.Background || "#9c27b0",
                        color: participant.Foreground || "#fff",
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
