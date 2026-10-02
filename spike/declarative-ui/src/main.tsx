import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import { App } from './app'

// Wired by t11 (PLAN.md): mounts the real pipeline under the dark wrapper defined in `app.tsx`.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
