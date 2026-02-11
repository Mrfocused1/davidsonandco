import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PropertyViewingDemoSimple from './components/PropertyViewingDemoSimple.jsx'

function Root() {
  // Check if we should show the demo
  const urlParams = new URLSearchParams(window.location.search);
  const showDemo = urlParams.get('demo') === 'true' || window.location.pathname === '/demo';

  console.log('URL Params:', window.location.search);
  console.log('Show Demo:', showDemo);

  if (showDemo) {
    return <PropertyViewingDemoSimple />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
