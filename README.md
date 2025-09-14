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

## ✨ Features

### Authentication & User Management
- **Secure Login/Signup**: Email and password authentication with form validation
- **Session Management**: Persistent login sessions with automatic token refresh using session-key
- **Profile Management**: User profile editing and account settings
- **Protected Routes**: Role-based access control for authenticated users
- **Automatic Session Validation**: App checks authentication status on startup

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

### Backend Integration
- **RESTful API** - Connects to .NET Web API backend
- **Session-based Authentication** - Secure session management
- **CORS Support** - Cross-origin resource sharing configured

### Development Tools
- **ESLint 9.33.0** - Code linting and formatting
- **TypeScript Types** - Type definitions for better development experience
- **Vite Dev Server** - Hot module replacement and fast development
- **ESLint React Hooks Plugin** - React-specific linting rules
- **ESLint React Refresh Plugin** - React Fast Refresh support

### Authentication
- **localStorage** - Client-side session management
- **Session Key Authentication** - Secure backend authentication

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
│   ├── common/          # Shared components (LoadingSpinner)
│   ├── home/            # Home page components
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
├── context/             # React Context providers
│   └── AppContext.jsx   # Global app state management
├── services/            # API and external services
│   └── apiService.js    # HTTP client and API calls
├── utils/               # Utility functions
│   └── sessionUtils.js  # Session management helpers
├── assets/              # Static assets
│   └── SVG/             # SVG icons and logos
├── App.jsx              # Main application component
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
- `GET /profileinfo` - Get user profile details
- `GET /user/profile` - Get user profile information

### Event Management Endpoints
- `GET /events` - Fetch all available events
- `GET /events/{id}` - Fetch specific event details
- `GET /user/events` - Get user's registered events

### Utility Endpoints
- `GET /test-db-connection` - Test database connectivity

### Authentication Flow
1. **Login**: Send credentials to `/auth/login`
2. **Session Key**: Backend returns a `session-key` in response headers
3. **Storage**: Session key is stored in localStorage
4. **API Calls**: All subsequent requests include `session-key` header
5. **Validation**: Backend validates session key on each request
6. **Logout**: Session key is cleared on logout

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
- The app automatically tests database connectivity on startup
- Session validation occurs on app initialization
- All API calls include proper error handling and logging
- Hot module replacement is enabled for fast development

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
- **Code Splitting**: Automatic code splitting for better performance
- **Asset Optimization**: Images and CSS are minified and optimized
- **Modern JavaScript**: ES modules with fallbacks for older browsers

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

**CORS Errors**: If you see CORS errors in the console, the backend needs to allow requests from your frontend domain.

**Session Issues**: If authentication fails, check that the session-key is being properly stored and sent with requests.

**API Connection**: The app will show connection test results in the console on startup.

**Build Issues**: Ensure you're using Node.js 18+ and npm 8+ for optimal compatibility.

### Performance Tips
- Use React DevTools for debugging
- Monitor bundle size with `npm run build`
- Check network tab for API call performance
- Use Lighthouse for performance auditing

---

**Note**: This is a frontend application that connects to a hosted .NET Web API backend. The backend handles all data persistence, authentication, and business logic.

## 🔄 Version History

- **v0.0.0** - Initial release with core event management features
- React 19.1.1 with modern hooks and context
- Material-UI 7.3.1 for consistent design system
- Vite 7.1.2 for fast development and building