import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely swallow harmless Vite WebSocket and HMR connection errors
if (typeof window !== 'undefined') {
  const handleViteError = (event: ErrorEvent | PromiseRejectionEvent) => {
    const message = 'message' in event ? event.message : (event.reason?.message || String(event.reason));
    if (
      message && 
      (message.includes('WebSocket') || 
       message.includes('websocket') || 
       message.includes('[vite]') || 
       message.includes('HMR'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  window.addEventListener('error', handleViteError, true);
  window.addEventListener('unhandledrejection', handleViteError, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
