import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LegalProvider } from './components/legal/LegalProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LegalProvider><App /></LegalProvider>
  </React.StrictMode>,
)
