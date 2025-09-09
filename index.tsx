// index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // your main app component
import "./index.css"; // global styles
import ReactGA from "react-ga4";

// ✅ Initialize GA once, globally
ReactGA.initialize("G-JHD0NKW137"); // <-- Replace with your Measurement ID

// Mount React app
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
