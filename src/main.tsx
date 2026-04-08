import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './firebase/config'
import './styles/global.css'
import './styles/print.css'
import { AuthGate } from './components/Auth/AuthGate'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)
