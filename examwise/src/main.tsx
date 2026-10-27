import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LoginPage from './auth/LoginPage'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { supabaseConfigured } from './lib/supabase'
import './index.css'

function Gate() {
  const { loading, session } = useAuth()
  if (!supabaseConfigured) return <App />        // local demo mode until .env is filled in
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>
  return session ? <App /> : <LoginPage />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </React.StrictMode>,
)
