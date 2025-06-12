import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import nhost from './nhost';
import { NhostProvider } from '@nhost/react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <NhostProvider nhost={nhost}>
    <App />
  </NhostProvider>
);