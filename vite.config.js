import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
          'utils-vendor': ['dayjs', 'bcryptjs'],
          // Common components (both host and guest)
          'common-components': [
            './src/components/home/dashboard/Dashboard.jsx',
            './src/components/profile/Profile.jsx'
          ],
          // Guest-specific components
          'guest-components': [
            './src/components/home/browse-events/BrowseEvents.jsx',
            './src/components/home/registered-events/RegisteredEvents.jsx',
            './src/components/home/event-history/EventHistory.jsx'
          ],
          // Host-specific components
          'host-components': [
            './src/components/home/new-event/NewEvent.jsx',
            './src/components/home/my-events/MyEvents.jsx',
            './src/components/home/manage-requests/ManageRequests.jsx'
          ],
          // Auth components (login/signup only)
          'auth-components': [
            './src/components/login/Login.jsx',
            './src/components/signup/Signup.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
