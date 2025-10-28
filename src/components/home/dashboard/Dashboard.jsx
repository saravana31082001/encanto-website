import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { events } from '../../../services/apiService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pastEvents: 0,
    pendingRequests: 0,
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.isHost) return; // Skip fetching for hosts

      try {
        setStats(prev => ({ ...prev, loading: true }));

        // Fetch guest data
        const [registeredEvents, pastEvents] = await Promise.all([
          events.getRegisteredEvents(user.userId),
          events.getPastAttendedEvents(user.userId)
        ]);

        // Filter registered events to only count upcoming ones where:
        // 1. Registration status = 1 (accepted/joined)
        // 2. Event active = 1 (not completed)
        const registeredArray = Array.isArray(registeredEvents) ? registeredEvents : [registeredEvents];
        const upcomingRegistered = registeredArray.filter(event => {
          // Check if user's registration status is 1 (accepted/joined)
          const participants = event.Participants || event.participants || [];
          const userParticipant = participants.find(p => 
            (p.participantId === user.userId || p.ParticipantId === user.userId)
          );
          const registrationStatus = userParticipant 
            ? (userParticipant.registrationStatus !== undefined ? userParticipant.registrationStatus : userParticipant.RegistrationStatus)
            : null;
          
          // Check if event is active (1 = active/upcoming, 0 = completed)
          const active = event.Active !== undefined ? event.Active : event.active;
          
          return registrationStatus === 1 && active === 1;
        });

        // Count pending requests: registration status = 0, active = 1
        const pendingRequests = registeredArray.filter(event => {
          const participants = event.Participants || event.participants || [];
          const userParticipant = participants.find(p => 
            (p.participantId === user.userId || p.ParticipantId === user.userId)
          );
          const registrationStatus = userParticipant 
            ? (userParticipant.registrationStatus !== undefined ? userParticipant.registrationStatus : userParticipant.RegistrationStatus)
            : null;
          const active = event.Active !== undefined ? event.Active : event.active;
          return registrationStatus === 0 && active === 1;
        });

        setStats({
          upcomingEvents: upcomingRegistered.length || 0,
          pastEvents: pastEvents?.length || 0,
          pendingRequests: pendingRequests.length || 0,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (!user) return null;

  // Render blank dashboard for hosts
  if (user.isHost) {
    return <div></div>;
  }

  // Render guest dashboard
  return (
    <div className="dashboard-container">
      {/* Header with gradient line */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <h2 className="section-title">Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Registered Events</div>
            <div className="stat-number">{stats.loading ? '...' : stats.upcomingEvents}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Events Attended</div>
            <div className="stat-number">{stats.loading ? '...' : stats.pastEvents}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-number">{stats.loading ? '...' : stats.pendingRequests}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="activity-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="activity-list">
          <div className="activity-item clickable" onClick={() => handleNavigate('/registered')}>
            <div className="activity-content">
              <div className="activity-title">Upcoming Events</div>
              <div className="activity-description">
                {stats.upcomingEvents > 0
                  ? `${stats.upcomingEvents} event${stats.upcomingEvents > 1 ? 's' : ''} coming up`
                  : "No upcoming events"
                }
              </div>
            </div>
          </div>

          <div className="activity-item clickable" onClick={() => handleNavigate('/history')}>
            <div className="activity-content">
              <div className="activity-title">Event History</div>
              <div className="activity-description">
                {stats.pastEvents > 0
                  ? `Attended ${stats.pastEvents} event${stats.pastEvents > 1 ? 's' : ''}`
                  : "Start your event journey by browsing available events"
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
