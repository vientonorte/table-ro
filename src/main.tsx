import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { injectCSPMeta, vientonorteCSP } from '@vientonorte/security';
import '@vientonorte/tokens/css';
import './styles/app.css';
import App from './App';

// CSP — table-ro: fetch a GCal API, AI providers (vía proxyUrl o directo)
injectCSPMeta({
  ...vientonorteCSP,
  scriptSrc: [
    ...(vientonorteCSP.scriptSrc ?? []),
    "'self'",
    'https://accounts.google.com',
  ],
  connectSrc: [
    ...(vientonorteCSP.connectSrc ?? []),
    "'self'",
    'https://www.googleapis.com',
    'https://calendar.google.com',
    'https://api.anthropic.com',
    'https://api.openai.com',
    'https://generativelanguage.googleapis.com',
  ],
  frameSrc: [
    ...(vientonorteCSP.frameSrc ?? []),
    'https://calendar.google.com',
  ],
});

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró #root en el DOM');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
