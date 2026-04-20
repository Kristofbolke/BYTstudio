// main.jsx — Ingangspunt van de BYT Studio applicatie
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { InstellingenProvider } from './context/InstellingenContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <InstellingenProvider>
        <App />
      </InstellingenProvider>
    </BrowserRouter>
  </React.StrictMode>
)
