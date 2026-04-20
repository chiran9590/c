import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const showBootError = (message: string) => {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    return;
  }

  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0f14;color:#e8edf5;padding:24px;font-family:Arial,sans-serif;">
      <div style="max-width:760px;width:100%;background:#131820;border:1px solid #1f2d3d;border-radius:12px;padding:20px;">
        <h2 style="margin:0 0 12px 0;">Application runtime error</h2>
        <p style="margin:0 0 8px 0;color:#8fa3bf;">Open browser console and share this error if needed:</p>
        <pre style="margin:0;white-space:pre-wrap;background:#0c0f14;padding:12px;border-radius:8px;border:1px solid #1f2d3d;">${message}</pre>
      </div>
    </div>
  `;
};

window.addEventListener('error', (event) => {
  if (event?.error?.message) {
    showBootError(event.error.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event.reason && event.reason.message) || String(event.reason || 'Unhandled Promise rejection');
  showBootError(reason);
});

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  showBootError(msg);
}
