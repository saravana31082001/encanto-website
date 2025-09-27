import React, { useState } from "react";
import "./BrowseEvents.css";
import eventsJson from "../../../assets/JsonData/Events.json"; // ✅ direct import

const BrowseEvents = () => {
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null); // For popup modal

  // Ensure JSON is always an array
  const eventsData = Array.isArray(eventsJson) ? eventsJson : [eventsJson];

  // Filter events by title
  const filteredEvents = eventsData.filter((event) =>
    event.Title.toLowerCase().includes(search.toLowerCase())
  );

  // Format schedule (date + start–end time)
  const formatSchedule = (start, end) => {
    if (!start || !end) return { date: "", timeRange: "" };

    const startDate = new Date(start);
    const endDate = new Date(end);

    const date = startDate.toLocaleDateString(); // same line
    const timeRange = `${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`; // next line

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
                {/* Header row */}
                <div className="event-header">
                  <h4 className="event-title">{event.Title}</h4>
                  <div className="organizer-header">
                    <span
                      className="organizer-logo"
                      style={{
                        backgroundColor:
                          event.OrganizerDetails?.Background || "#eee",
                        color: event.OrganizerDetails?.Foreground || "#111",
                      }}
                    >
                      {event.OrganizerDetails?.OrganizerName
                        ? event.OrganizerDetails.OrganizerName[0]
                        : "?"}
                    </span>
                    <h3 className="organizer-name">
                      {event.OrganizerDetails?.OrganizerName ||
                        "Unknown Organizer"}
                    </h3>
                  </div>
                </div>

                {/* Middle row */}
                <div className="event-body">
                  <p className="event-description">{event.Description}</p>
                  <div className="event-time">
                    <h4>Schedule</h4>
                    <p>{date}</p>
                    <p>{timeRange}</p>
                  </div>
                </div>

                {/* Footer row */}
                <div className="event-footer">
                  <button
                    className="participants-btn"
                    onClick={() => setSelectedEvent(event)}
                  >
                    Total Participants ({event.Participants?.length || 0})
                  </button>

                  <button className="register-btn">Apply</button>
                </div>
              </div>
            );
          })
        ) : (
          <p>No events found</p>
        )}
      </div>

      {/* Popup Modal */}
      {selectedEvent && (
        <div className="popup-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              Participants - {selectedEvent.Title} (
              {selectedEvent.Participants?.length || 0})
            </h2>
            <ul type="none">
              {selectedEvent.Participants &&
                [...selectedEvent.Participants]
                  .sort((a, b) =>
                    a.ParticipantName.localeCompare(b.ParticipantName)
                  )
                  .map((p) => (
                    <li key={p.ParticipantId}>
                      <span
                        className="participant-logo"
                        style={{
                          backgroundColor: p.Background || "#ccc",
                          color: p.Foreground || "#000",
                        }}
                      >
                        {p.ParticipantName[0]}
                      </span>
                      {p.ParticipantName}
                    </li>
                  ))}
            </ul>
            <button
              className="close-btn"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
