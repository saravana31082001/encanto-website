import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import LoadingSpinner from '../common/LoadingSpinner';
import EncantoLogo from '../../assets/SVG/EncantoLogo.svg';
import './Home.css';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const BrowseEvents = lazy(() => import('./browse-events/BrowseEvents'));
const RegisteredEvents = lazy(() => import('./registered-events/RegisteredEvents'));
const EventHistory = lazy(() => import('./event-history/EventHistory'));
const NewEvent = lazy(() => import('./new-event/NewEvent'));
const MyEvents = lazy(() => import('./my-events/MyEvents'));
const ManageRequests = lazy(() => import('./manage-requests/ManageRequests'));
const Profile = lazy(() => import('../profile/Profile'));

const Home = ({ activeSection }) => {
  const [activeComponent, setActiveComponent] = useState(activeSection || 'Dashboard');
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, loading } = useApp(); // Get user data from context instead of API call

  // Get user data from context (no API call needed)
  const userName = user?.name || 'User';
  const userProfileType = user?.profileType || 'Guest';
  
  // Get colors from user profile data with fallback defaults
  const foregroundColor = user?.foregroundColour || '#009688';
  const backgroundColour = user?.backgroundColour || '#B2DFDB';

  // Update active component when route changes
  useEffect(() => {
    if (activeSection) {
      setActiveComponent(activeSection);
    } else if (location.pathname === '/profile') {
      setActiveComponent('Profile');
    } else {
      // Handle host routes
      const isHost = userProfileType.toLowerCase() === 'host';
      if (isHost) {
        switch (location.pathname) {
          case '/dashboard':
            setActiveComponent('Dashboard');
            break;
          case '/create':
            setActiveComponent('NewEvent');
            break;
          case '/events':
            setActiveComponent('MyEvents');
            break;
          case '/manage':
            setActiveComponent('ManageRequests');
            break;
          default:
            setActiveComponent('Dashboard');
        }
      }
    }
  }, [activeSection, location.pathname, userProfileType]);

  const handleLogout = () => {
    logout(); // Call the context logout function which clears state and redirects
  };

  const handleProfileClick = () => {
    // Use navigation for all users (both guest and host)
    navigate('/profile');
  };

  // Define menu items based on user profile type
  const getMenuItems = () => {
    const isHost = userProfileType.toLowerCase() === 'host';
    
    if (isHost) {
      return [
        { name: 'Dashboard', component: 'Dashboard', icon: '📅', path: '/dashboard' },
        { name: 'New Event', component: 'NewEvent', icon: '➕', path: '/create' },
        { name: 'My Events', component: 'MyEvents', icon: '📋', path: '/events' },
        { name: 'Manage Requests', component: 'ManageRequests', icon: '⚙️', path: '/manage' },
        { name: 'Logout', component: 'Logout', icon: '➜]', path: '/login' }
      ];
    } else {
      // Guest menu items
      return [
        { name: 'Dashboard', component: 'Dashboard', icon: '📅', path: '/dashboard' },
        { name: 'Browse Events', component: 'BrowseEvents', icon: '🔎', path: '/browse' },
        { name: 'Registered Events', component: 'RegisteredEvents', icon: '🗳️', path: '/registered' },
        { name: 'Event History', component: 'EventHistory', icon: '⌛', path: '/history' },
        { name: 'Logout', component: 'Logout', icon: '➜]', path: '/login' }
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleMenuClick = (item) => {
    if (item.component === 'Logout') {
      handleLogout();
    } else {
      // Use navigation for all components (both guest and host)
      navigate(item.path);
    }
  };

  const renderActiveComponent = () => {
    const ComponentToRender = () => {
      switch (activeComponent) {
        case 'Dashboard':
          return <Dashboard />;
        case 'BrowseEvents':
          return <BrowseEvents />;
        case 'RegisteredEvents':
          return <RegisteredEvents />;
        case 'EventHistory':
          return <EventHistory />;
        case 'NewEvent':
          return <NewEvent />;
        case 'MyEvents':
          return <MyEvents />;
        case 'ManageRequests':
          return <ManageRequests />;
        case 'Profile':
          return <Profile />;
        default:
          return <Dashboard />;
      }
    };

    return (
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        <ComponentToRender />
      </Suspense>
    );
  };

  return (
    <div 
      className="container"
      style={{
        '--home-foreground-color': foregroundColor,
        '--home-background-color': backgroundColour
      }}
    >
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img 
          src={EncantoLogo} 
          alt="Encanto Logo" 
          style={{
            height: '32px',
            width: 'auto',
            padding: '0px',
            display: 'block'
          }}
        />
        <div className={`user-profile ${location.pathname === '/profile' ? 'profile-active' : ''}`} onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
          <div className="avatar">
            <span>{loading ? '...' : userName.charAt(0).toUpperCase()}</span>
          </div>
          <span className="role">
            {loading ? 'Loading...' : userProfileType.charAt(0).toUpperCase() + userProfileType.slice(1)}
          </span>
        </div>
      </header>
      <div className="main-layout">
        <aside className="sidebar">
          <nav>
            <ul>
              {menuItems.map((item, index) => {
                // Determine if this menu item should be active
                const isActive = item.component === 'Logout' 
                  ? false 
                  : (activeComponent === 'Profile')
                    ? false
                    : (location.pathname === item.path);
                
                return (
                  <li
                    key={index}
                    className={`${isActive ? 'active' : ''} ${item.component === 'Logout' ? 'logout-item' : ''}`}
                    onClick={() => handleMenuClick(item)}
                  >
                    <span className="icon">{item.icon}</span>
                    {item.name}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="main-content">
          <div className="content-area">
            {renderActiveComponent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
