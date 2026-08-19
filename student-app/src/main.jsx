import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n'
import App from './App.jsx'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}

createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<div style={{ padding: 40, color: '#fff' }}>Something went wrong. Please refresh the page.</div>}>
    <App />
  </Sentry.ErrorBoundary>
)
