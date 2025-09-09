// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ReactGA from "react-ga4";

// ✅ Initialize GA once here
ReactGA.initialize("G-JHD0NKW137");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
