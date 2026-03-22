import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-accent)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                fontSize: '14px',
                boxShadow: 'var(--shadow-card), var(--shadow-purple)',
                transition: 'all 0.3s ease',
              },
              success: {
                iconTheme: { primary: '#a855f7', secondary: '#ffffff' },
              },
              error: {
                iconTheme: { primary: '#f43f5e', secondary: '#ffffff' },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
