import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('#root element not found — el script debe ejecutarse tras parsear el DOM')
}
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
