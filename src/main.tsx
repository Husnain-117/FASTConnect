import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './contexts/SocketContext'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter as Router } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
)
