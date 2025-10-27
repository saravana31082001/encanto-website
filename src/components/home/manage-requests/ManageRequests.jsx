import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useApiService } from '../../../services/apiService';
import './ManageRequests.css';

const ManageRequests = () => {
  const { user } = useApp();
  const { getPendingRequests, updatePendingRequest } = useApiService();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPendingRequests(user.userId);
        setPendingRequests(data || []);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [user, getPendingRequests]);

  const handleAccept = async (eventId, participantId) => {
    const requestKey = `${eventId}-${participantId}`;
    if (processingRequests.has(requestKey)) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(requestKey));
      await updatePendingRequest(eventId, participantId, true);
      
      // Remove the request from the list after successful acceptance
      setPendingRequests(prev => 
        prev.filter(req => 
          !(req.eventId === eventId && req.participantDetails.participantId === participantId)
        )
      );
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestKey);
        return newSet;
      });
    }
  };

  const handleReject = async (eventId, participantId) => {
    const requestKey = `${eventId}-${participantId}`;
    if (processingRequests.has(requestKey)) return;

    try {
      setProcessingRequests(prev => new Set(prev).add(requestKey));
      await updatePendingRequest(eventId, participantId, false);
      
      // Remove the request from the list after successful rejection
      setPendingRequests(prev => 
        prev.filter(req => 
          !(req.eventId === eventId && req.participantDetails.participantId === participantId)
        )
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestKey);
        return newSet;
      });
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="manage-requests-container">
        <div className="manage-requests-header">
          <h1>Manage Requests</h1>
          <p>Review and respond to participant requests for your private events</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-requests-container">
      <div className="manage-requests-header">
        <h1>Manage Requests</h1>
        <p>Review and respond to participant requests for your private events</p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p>No pending requests at the moment</p>
        </div>
      ) : (
        <div className="requests-list-container">
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={`${request.eventId}-${request.participantDetails.participantId}`} className="request-card">
                <div className="request-info">
                  <div className="request-event-section">
                    <span className="request-label">Event</span>
                    <span 
                      className="request-event-name" 
                      title={request.eventName}
                    >
                      {request.eventName}
                    </span>
                    <span className="request-schedule">
                      {formatDate(request.startTimestamp)} • {formatTime(request.startTimestamp)}
                    </span>
                  </div>
                  
                  <div className="request-participant-section">
                    <span className="request-label">Requested by</span>
                    <div className="request-participant-info">
                      <div 
                        className="request-participant-avatar"
                        style={{
                          backgroundColor: request.participantDetails.backgroundColour,
                          color: request.participantDetails.foregroundColour
                        }}
                      >
                        {request.participantDetails.participantName.charAt(0).toUpperCase()}
                      </div>
                      <span 
                        className="request-participant-name"
                        title={request.participantDetails.participantName}
                      >
                        {request.participantDetails.participantName}
                      </span>
                    </div>
                    <span className="request-timestamp">
                      Requested on {formatDate(request.participantRequestTimestamp)}
                    </span>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="accept-button"
                    onClick={() => handleAccept(request.eventId, request.participantDetails.participantId)}
                    disabled={processingRequests.has(`${request.eventId}-${request.participantDetails.participantId}`)}
                    title="Accept request"
                  >
                    <svg 
                      className="button-icon" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleReject(request.eventId, request.participantDetails.participantId)}
                    disabled={processingRequests.has(`${request.eventId}-${request.participantDetails.participantId}`)}
                    title="Reject request"
                  >
                    <svg 
                      className="button-icon" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRequests;