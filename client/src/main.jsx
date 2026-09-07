import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // تأكد من أن ملف التنسيقات موجود
import App from './App.jsx' // تأكد من أن مسار ملف App صحيح

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);