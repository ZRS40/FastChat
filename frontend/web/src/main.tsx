import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles.css'
import Login from './pages/Login'
import Chat from './pages/Chat'

const queryClient = new QueryClient()

function App() {
  const [hasToken, setHasToken] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    const onAuthChange = () => setHasToken(!!localStorage.getItem('token'))
    window.addEventListener('auth:changed', onAuthChange)
    return () => window.removeEventListener('auth:changed', onAuthChange)
  }, [])

  return hasToken ? <Chat /> : <Login />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)


