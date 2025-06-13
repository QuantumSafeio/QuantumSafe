import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { NhostClient, NhostProvider } from '@nhost/react'

const nhost = new NhostClient({
  subdomain: 'clgbrceckxfctgvuokup', 
  region: 'eu-central-1'
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NhostProvider nhost={nhost}>
      <App />
    </NhostProvider>
  </React.StrictMode>
)