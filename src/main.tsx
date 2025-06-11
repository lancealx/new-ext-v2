import React from 'react'
import ReactDOM from 'react-dom/client'
// We'll skip importing App for now as we're focusing on the extension background/content scripts
// import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>Chrome Extension Setup</div>
  </React.StrictMode>,
)
