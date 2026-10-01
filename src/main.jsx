import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider, AuthProvider } from './context'
import { ToastProvider } from './components/feedback/ToastProvider'
import { useT } from './i18n'
import { ConfirmProvider } from './components/feedback/ConfirmProvider'

// Changer de langue remonte l'arbre : tous les textes se recalculent.
const Root = () => { const { lang } = useT(); return <App key={lang} />; };

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <AppProvider>
            <Root />
          </AppProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
)
