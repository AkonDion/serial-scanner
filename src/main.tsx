import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ZohoCRMClient from "./services/zohoSDK.js";

// Initialize Zoho CRM SDK before rendering the app
ZohoCRMClient.init()
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((error) => {
    console.error("Failed to initialize Zoho CRM SDK:", error);
    // You might want to show an error screen here
  });
