import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import ZohoCRMClient from './services/zohoSDK'

// Initialize Zoho CRM SDK before rendering the app
ZohoCRMClient.init().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}).catch(error => {
  console.error('Failed to initialize Zoho CRM SDK:', error);
  // You might want to show an error screen here
});