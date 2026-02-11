import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PropertyViewingDemo from './components/PropertyViewingDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PropertyViewingDemo />
  </StrictMode>,
)
