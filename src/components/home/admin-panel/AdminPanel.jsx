import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { events } from '../../../services/apiService';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [stats, setStats] = useState({
    totalEventsHosted: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    pendingRequests: 0,
    loading: true
  });

  useEffect(() => {
    const fetchHostDashboardData = async () => {
      // Check if user is a host using profileType
      const isHost = user?.isHost || user?.profileType?.toLowerCase() === 'host';
      if (!isHost) return; // Only for hosts

      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Fetch host data
        const [upcomingEvents, pastEvents, pendingRequests] = await Promise.all([
          events.getHostedUpcomingEvents(user.userId),
          events.getHostedPastEvents(user.userId),
          events.getPendingRequests(user.userId)
        ]);

        const upcomingArray = Array.isArray(upcomingEvents) ? upcomingEvents : [upcomingEvents];
        const pastArray = Array.isArray(pastEvents) ? pastEvents : [pastEvents];
        const pendingArray = Array.isArray(pendingRequests) ? pendingRequests : [pendingRequests];

        // Filter out any null or undefined items
        const validUpcoming = upcomingArray.filter(e => e?.eventId);
        const validPast = pastArray.filter(e => e?.eventId);
        const validPending = pendingArray.filter(e => e?.eventId);

        setStats({
          totalEventsHosted: validUpcoming.length + validPast.length,
          upcomingEvents: validUpcoming.length || 0,
          pastEvents: validPast.length || 0,
          pendingRequests: validPending.length || 0,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch host dashboard data:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchHostDashboardData();
  }, [user]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (!user) return null;

  // Check if user is a host using profileType or isHost
  const isHost = user.isHost || user.profileType?.toLowerCase() === 'host';
  
  // Render blank if not a host
  if (!isHost) {
    return <div></div>;
  }

  // Prepare messages
  const pendingRequestsPlural = stats.pendingRequests > 1 ? 's' : '';
  const pendingRequestsText = stats.pendingRequests > 0
    ? `${stats.pendingRequests} pending request${pendingRequestsPlural} awaiting your response`
    : "No pending requests at the moment";

  const upcomingEventsPlural = stats.upcomingEvents > 1 ? 's' : '';
  const upcomingEventsText = stats.upcomingEvents > 0
    ? `View and manage your ${stats.upcomingEvents} upcoming event${upcomingEventsPlural}`
    : "Create your first event to get started";

  // Render host admin panel
  return (
    <div className="admin-panel-container">
      {/* Header with gradient line */}
      <div className="admin-panel-header">
        <h1>Host Dashboard</h1>
        <p>Manage your events and guest requests</p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-section">
        <h2 className="admin-section-title">Overview</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-label">Total Events Hosted</div>
            <div className="admin-stat-number">{stats.loading ? '...' : stats.totalEventsHosted}</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">Upcoming Events</div>
            <div className="admin-stat-number">{stats.loading ? '...' : stats.upcomingEvents}</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-label">Past Events</div>
            <div className="admin-stat-number">{stats.loading ? '...' : stats.pastEvents}</div>
          </div>

          <div className="admin-stat-card highlight">
            <div className="admin-stat-label">Pending Requests</div>
            <div className="admin-stat-number">{stats.loading ? '...' : stats.pendingRequests}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="admin-activity-section">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-activity-list">
          <button 
            className="admin-activity-item clickable" 
            onClick={() => handleNavigate('/create')}
            type="button"
          >
            <div className="admin-activity-content">
              <div className="admin-activity-title">Create New Event</div>
              <div className="admin-activity-description">
                Set up a new event and start inviting guests
              </div>
            </div>
          </button>

          <button 
            className="admin-activity-item clickable" 
            onClick={() => handleNavigate('/manage')}
            type="button"
          >
            <div className="admin-activity-content">
              <div className="admin-activity-title">Manage Requests</div>
              <div className="admin-activity-description">
                {pendingRequestsText}
              </div>
            </div>
          </button>

          <button 
            className="admin-activity-item clickable" 
            onClick={() => handleNavigate('/events')}
            type="button"
          >
            <div className="admin-activity-content">
              <div className="admin-activity-title">My Events</div>
              <div className="admin-activity-description">
                {upcomingEventsText}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Host Insights Section */}
      <div className="admin-insights-section">
        <h2 className="admin-section-title">Host Insights</h2>
        <div className="admin-insights-grid">
          <div className="admin-insight-card">
            <div className="admin-insight-content">
              <div className="admin-insight-value">
                {stats.totalEventsHosted > 0 
                  ? `${((stats.pastEvents / stats.totalEventsHosted) * 100).toFixed(0)}%`
                  : '0%'
                }
              </div>
              <div className="admin-insight-label">Events Completed</div>
            </div>
          </div>

          <div className="admin-insight-card">
            <div className="admin-insight-content">
              <div className="admin-insight-value">{stats.upcomingEvents}</div>
              <div className="admin-insight-label">Events Scheduled</div>
            </div>
          </div>

          <div className="admin-insight-card">
            <div className="admin-insight-content">
              <div className="admin-insight-value">{stats.pendingRequests}</div>
              <div className="admin-insight-label">Awaiting Approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;