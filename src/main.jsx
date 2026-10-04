import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import { I18nProvider } from './i18n/index.jsx'
import { RouterProvider } from './router/index.jsx'
import { migrateLegacyKeys } from './lib/storage.js'
import './index.css'

// Переносим данные старой версии (префикс "tt.*") в "doneo.*" до первого рендера.
migrateLegacyKeys()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <RouterProvider>
            <App />
          </RouterProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </I18nProvider>
  </React.StrictMode>,
)
