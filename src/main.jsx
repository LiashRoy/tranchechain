import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log("Cache bust version: 1786043839493");

console.log("Cache bust version: 1786032034661");

console.log("Cache bust version: 1786032744587");
