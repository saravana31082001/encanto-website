# EncantoWebApp

A modern React-based event management application with comprehensive authentication, user dashboard, and event browsing capabilities. This frontend application connects to a .NET Web API backend for data management and user authentication.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

EncantoWebApp is a full-featured event management platform that provides users with the ability to browse events, register for activities, view their event history, and manage their profile. The application features a modern, responsive design with secure authentication and intuitive navigation.

**Backend Integration**: This React frontend connects to a .NET Web API backend hosted at `https://encanto-webapi.azurewebsites.net` for all data operations and authentication.

## 🎯 Key Highlights

- **Production-Ready Architecture**: Centralized API service, constants management, and global state with React Context
- **Real-time Communication**: SignalR integration with automatic reconnection for live event updates
- **Comprehensive Profile System**: Granular updates for personal info, contact details, and occupation with client-side validation
- **Global Notification System**: Custom event-based toast notifications for all API operations
- **Optimized Build**: Strategic code splitting with separate chunks for vendors, common, guest, and host components
- **Session Security**: Automatic session validation on startup with protected route guards
- **Modern Development**: React 19, Vite 7, Material-UI 7, with hot module replacement

## ✨ Features

### Authentication & User Management
- **Secure Login/Signup**: Email and password authentication with bcryptjs hashing and form validation
- **Session Management**: Persistent login sessions using session-key stored in localStorage
- **Automatic Session Validation**: AppContext validates session on startup and fetches user data
- **Profile Management**: Comprehensive profile editing with granular field updates
  - Personal Info: Name, Gender, Birthday (with Material-UI DatePicker)
  - Contact Info: Phone (10-digit validation), Home Address (with landmark)
  - Work Info: Designation, Organization, Industry, Employment Type, Work Location, Work Email, Work Phone
- **Protected Routes**: All authenticated routes redirect to login if session is invalid
- **Email Validation**: Primary account email is non-editable; work email validates format before submission
- **Real-time Profile Refresh**: User data automatically refreshed after successful updates

### Event Management
- **Event Browsing**: Browse and search through available events
- **Event Registration**: Register for events with real-time availability
- **Event History**: View past and upcoming registered events
- **Dashboard**: Comprehensive overview of user activity and statistics
- **My Events**: Manage your own created events
- **Manage Requests**: Handle event registration requests

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, intuitive interface built with Material-UI components
- **Loading States**: Smooth loading indicators and error handling
- **Navigation**: Intuitive routing with React Router
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Global Toast Notifications**: Real-time success/error feedback for all API operations
- **Real-time Updates**: SignalR integration for live event notifications

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Modern UI library with hooks and context
- **Vite 7.1.2** - Fast build tool and development server
- **React Router DOM 7.8.1** - Client-side routing
- **Material-UI 7.3.1** - Component library and design system
- **Material-UI X Date Pickers 8.11.0** - Advanced date/time components
- **Emotion 11.14.0** - CSS-in-JS styling solution
- **Day.js 1.11.18** - Lightweight date manipulation library
- **bcryptjs 3.0.2** - Password hashing and verification
- **@microsoft/signalr 8.0.7** - Real-time communication library for SignalR

### Backend Integration
- **RESTful API** - Connects to .NET Web API backend
- **Session-based Authentication** - Secure session management with session-key headers
- **CORS Support** - Cross-origin resource sharing configured
- **SignalR Hub** - Real-time bidirectional communication with `/notificationhub`
- **Automatic Reconnection** - SignalR with exponential backoff reconnection strategy

### Development Tools
- **ESLint 9.33.0** - Code linting and formatting
- **TypeScript Types** - Type definitions for better development experience
- **Vite Dev Server** - Hot module replacement and fast development
- **ESLint React Hooks Plugin** - React-specific linting rules
- **ESLint React Refresh Plugin** - React Fast Refresh support

### State Management & Architecture
- **React Context API** - Global state management with AppContext
- **Custom Hooks** - `useApp()` for accessing global state and auth methods
- **Centralized API Service** - Unified `apiService.js` with modular endpoints
- **Constants Management** - Centralized API endpoints, HTTP methods, status codes in `apiConstants.js`

## 📋 Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/encanto-webapp.git
   cd encanto-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## 📖 Usage

### Getting Started
1. **Sign Up**: Create a new account using the signup form
2. **Login**: Use your credentials to access the application
3. **Dashboard**: View your personalized dashboard upon login
4. **Browse Events**: Explore available events and activities
5. **Register**: Sign up for events that interest you
6. **Profile**: Manage your account settings and preferences

### Navigation
- **Dashboard** (`/dashboard`) - Main overview and statistics
- **Browse Events** (`/browse`) - Discover and search events
- **My Events** (`/my-events`) - Events you've created
- **Registered Events** (`/registered`) - Your upcoming events
- **Event History** (`/history`) - Past event participation
- **Manage Requests** (`/manage-requests`) - Handle event requests
- **New Event** (`/new-event`) - Create new events
- **Profile** (`/profile`) - Account management

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components
│   │   ├── LoadingSpinner.jsx  # Loading indicator
│   │   ├── LoadingSpinner.css
│   │   ├── GlobalToast.jsx     # Global notification system
│   │   └── GlobalToast.css
│   ├── home/            # Home page components
│   │   ├── Home.jsx     # Main home container with sidebar
│   │   ├── dashboard/   # Dashboard section
│   │   ├── browse-events/ # Event browsing
│   │   ├── my-events/   # User's created events
│   │   ├── registered-events/ # User's registered events
│   │   ├── event-history/ # Event history
│   │   ├── manage-requests/ # Request management
│   │   └── new-event/   # Event creation
│   ├── login/           # Authentication components
│   ├── signup/          # Registration components
│   └── profile/         # User profile components
├── constants/           # Configuration constants
│   └── apiConstants.js  # API endpoints, HTTP methods, status codes, messages
├── context/             # React Context providers
│   └── AppContext.jsx   # Global app state management
├── services/            # API and external services
│   └── apiService.js    # Unified HTTP client and API modules
├── utils/               # Utility functions
│   └── sessionUtils.js  # Session management and password hashing
├── assets/              # Static assets
│   ├── JsonData/        # JSON data files
│   └── SVG/             # SVG icons and logos
├── signalrConnection.js # SignalR real-time connection setup
├── App.jsx              # Main application component with routing
├── App.css              # Global styles
├── index.css            # Base styles
└── main.jsx             # Application entry point
```

## 🔌 API Documentation

The application connects to a .NET Web API backend hosted at `https://encanto-webapi.azurewebsites.net`:

### Backend API Endpoints
- **Base URL**: `https://encanto-webapi.azurewebsites.net`
- **Swagger Documentation**: `https://encanto-webapi.azurewebsites.net/swagger/index.html`

### Authentication Endpoints
- `POST /auth/login` - User login (returns session-key)
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout (clears session)

### User Management Endpoints
- `GET /profile/info` - Get user profile details
- `PUT /profile/update-user-name` - Update name
- `PUT /profile/update-user-phone-number` - Update phone number
- `PUT /profile/update-user-gender` - Update gender
- `PUT /profile/update-user-birthday` - Update date of birth (DD-MM-YYYY)
- `PUT /profile/update-user-address` - Update home address
- `PUT /profile/update-user-occupation` - Update occupation details (designation, organization, industry, employmentType, workEmail, workPhoneNumber, work location)

### Event Management Endpoints
- `GET /events` - Fetch all available events
- `GET /events/browse-upcoming` - Browse upcoming events
- `GET /events/{id}` - Fetch specific event details
- `POST /events/new` - Create a new event
- `GET /user/events` - Get user's registered events

### Utility Endpoints
- `GET /test-db-connection` - Test database connectivity

### Authentication Flow
1. **Signup**: User registers via `/auth/signup` with name, email, hashed password, and role (guest/host)
2. **Login**: Send credentials to `/auth/login` with email and hashed password (bcryptjs)
3. **Session Key**: Backend returns a `session-key` in JSON response body
4. **Storage**: Session key is stored in localStorage as `'session-key'`
5. **API Calls**: All subsequent requests include `session-key` in request headers
6. **Validation**: Backend validates session key on each request; app validates on startup
7. **Auto Initialization**: AppContext checks session validity on app load and fetches user data
8. **Logout**: Call `/auth/logout` endpoint, clear session key from localStorage, reset app state

### Profile Update Flow
- **Granular Updates**: Each profile field has its own dedicated endpoint (name, phone, gender, birthday, address, occupation)
- **Validation**: Client-side validation before sending (email format, phone format, required fields)
- **Real-time Refresh**: After successful update, user data is refreshed from backend via `updateUser()`
- **Toast Notifications**: Success/error feedback via GlobalToast component using custom events

### SignalR Real-time Connection
- **Hub URL**: `https://encanto-webapi.azurewebsites.net/notificationhub`
- **Authentication**: Custom HTTP client adds `session-key` header to SignalR requests
- **Auto Reconnect**: Automatic reconnection with exponential backoff (immediate, 2s, 10s, 30s)
- **Event Subscription**: Subscribe to `EventChanged` messages for real-time event updates
- **Connection Management**: Start/stop connection with state tracking

## 🛠 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Code Style
- Follow ESLint configuration for consistent code style
- Use functional components with hooks
- Implement proper error handling and loading states
- Write descriptive component and function names

### Environment Variables
The application is configured to connect to the production backend by default. No environment variables are required for basic functionality.

**Backend Configuration**: The API base URL is hardcoded to `https://encanto-webapi.azurewebsites.net` in the `apiService.js` file.

### CORS Configuration
If you're running a local backend, ensure CORS is configured to allow requests from `http://localhost:5173`.

### Development Notes
- The app automatically tests database connectivity on startup via `/test-db-connection`
- Session validation occurs on app initialization in `AppContext.jsx`
- All API calls include proper error handling, logging, and global toast notifications
- Hot module replacement is enabled for fast development
- Profile page work email field uses client-side validation and trims whitespace before sending updates
- Primary account email is non-editable; work email is editable with validation
- Password hashing uses bcryptjs with 10 salt rounds before sending to backend
- AppContext uses React Context API with useReducer for state management
- Protected routes automatically redirect to `/login` if not authenticated
- GlobalToast listens to `api:notify` custom events for notifications

### API Service Architecture
The `apiService.js` is organized into modular exports:
- **auth**: `login()`, `register()`, `logout()`, `isAuthenticated()`
- **user**: `getDetails()`, `updateProfile()`, `updateOccupation()`
- **events**: `getAll()`, `getBrowseUpcoming()`, `getById()`, `getUserEvents()`, `create()`
- **app**: `testDatabase()`
- **useApiService()**: React hook providing access to all API functions

### Constants Management
`apiConstants.js` centralizes:
- **API_CONFIG**: Base URL, default headers, session key name
- **Endpoints**: AUTH_ENDPOINTS, USER_ENDPOINTS, EVENT_ENDPOINTS, APP_ENDPOINTS
- **HTTP_STATUS**: Status code constants (200, 400, 401, 403, 404, 500)
- **HTTP_METHODS**: GET, POST, PUT, PATCH, DELETE
- **Messages**: SUCCESS_MESSAGES, ERROR_MESSAGES for consistent UX

## 🏗 Building for Production

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   The `dist/` folder contains the production-ready files that can be deployed to any static hosting service.

### Build Output
- **Static Files**: All assets are optimized and bundled
- **Manual Code Splitting**: Strategic chunk separation for optimal loading
  - `react-vendor`: React, React DOM, React Router
  - `mui-vendor`: Material-UI components and styling libraries
  - `utils-vendor`: Day.js, bcryptjs utilities
  - `common-components`: Dashboard, Profile (used by all users)
  - `guest-components`: Browse Events, Registered Events, Event History
  - `host-components`: New Event, My Events, Manage Requests
  - `auth-components`: Login, Signup
- **Asset Optimization**: Images and CSS are minified and optimized
- **Modern JavaScript**: ES modules with Vite's optimized bundling
- **Azure Static Web Apps Ready**: Includes `staticwebapp.config.json` for SPA routing

## 🏛️ Architecture Overview

### Application Flow
1. **Initialization** (`main.jsx`): React app mounts with StrictMode
2. **App Provider** (`App.jsx`): AppContext wraps entire app, initializes session validation
3. **Session Check**: AppContext checks localStorage for session-key
   - If found: Validates with backend via `/profile/info`
   - If invalid: Clears session, redirects to login
   - If valid: Stores user data in context state
4. **Routing**: React Router handles navigation with protected route guards
5. **Global Toast**: Listens for `api:notify` custom events throughout app lifecycle

### Data Flow
```
Component → useApiService() → apiService module → makeApiCall() → Backend API
                                                         ↓
                                                  Success/Error
                                                         ↓
                                      GlobalToast (api:notify event)
                                                         ↓
                                              User sees notification
```

### State Management
- **Global State**: AppContext with useReducer (user, isAuthenticated, loading, error, sessionKey)
- **Local State**: Component-level useState for forms and UI state
- **Session Storage**: localStorage for persisting session-key across page refreshes
- **Real-time State**: SignalR connection for live event updates

### Component Organization
- **Common**: Shared components used across all pages (LoadingSpinner, GlobalToast)
- **Auth**: Login and Signup with form validation
- **Home**: Main authenticated container with sidebar navigation
- **Sections**: Dashboard, Browse Events, My Events, Registered Events, Event History, Manage Requests, Profile
- **Protected**: All sections under Home are protected and require authentication

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting
- Use conventional commit messages

### Code Standards
- Use functional components with React hooks
- Implement proper TypeScript types where applicable
- Follow Material-UI design patterns
- Ensure responsive design for all components
- Add proper error boundaries and loading states

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Check the browser console for detailed error messages
2. Verify the backend API is accessible at `https://encanto-webapi.azurewebsites.net`
3. Check the Swagger documentation for API details
4. Ensure CORS is properly configured if running a local backend

### Common Issues

**CORS Errors**: If you see CORS errors in the console, the backend needs to allow requests from your frontend domain. The backend CORS policy must include your origin.

**Session Issues**: If authentication fails, check that:
- The session-key is being stored in localStorage after login
- The session-key header is included in all API requests
- The backend session hasn't expired
- Clear localStorage and try logging in again

**API Connection**: The app automatically tests `/test-db-connection` on startup. Check browser console for connection test results.

**Build Issues**: Ensure you're using Node.js 18+ and npm 8+ for optimal compatibility.

**Profile Updates**: If profile updates fail:
- Check that the user has a valid session-key
- Verify the backend endpoints match the frontend constants
- Check browser console for detailed error messages from the API
- GlobalToast will show user-friendly error messages

**SignalR Connection**: If real-time updates aren't working:
- Ensure the backend SignalR hub is running at `/notificationhub`
- Check that the session-key is being sent with SignalR handshake
- Look for reconnection attempts in the console
- SignalR will auto-reconnect with exponential backoff

### Performance Tips
- Use React DevTools for debugging
- Monitor bundle size with `npm run build`
- Check network tab for API call performance
- Use Lighthouse for performance auditing

---

**Note**: This is a frontend application that connects to a hosted .NET Web API backend. The backend handles all data persistence, authentication, and business logic.

## 🔄 Version History

### v0.1.0 - Major API & Architecture Improvements
- **Centralized API Management**: Unified `apiService.js` with modular exports (auth, user, events, app)
- **Constants System**: Created `apiConstants.js` for centralized endpoint, status code, and message management
- **Granular Profile Updates**: Individual endpoints for each profile field (name, phone, gender, birthday, address, occupation)
- **Enhanced Context**: AppContext with session validation, auto-initialization, and user refresh
- **Global Notifications**: GlobalToast component with custom event system for API feedback
- **SignalR Integration**: Real-time connection with auto-reconnect and session-key authentication
- **Email Validation**: Client-side validation for work email with format checking
- **Protected Routes**: Automatic redirect to login for unauthenticated users
- **Code Splitting**: Strategic chunk separation in Vite config for optimized loading
- **Azure Deployment**: Static Web Apps configuration for SPA routing

### v0.0.0 - Initial Release
- React 19.1.1 with modern hooks and context
- Material-UI 7.3.1 for consistent design system
- Vite 7.1.2 for fast development and building
- Basic authentication and event management features