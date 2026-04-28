import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ServerProvider } from './contexts/ServerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServerProvider>
      <App />
    </ServerProvider>
  </StrictMode>,
)