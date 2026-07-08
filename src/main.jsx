import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/i18n.js';
import './index.css';
import './styles/theme.css';
import './styles/markers.css';
import './styles/station-panel.css';
import './styles/tools.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
