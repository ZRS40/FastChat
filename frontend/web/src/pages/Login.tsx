import { useState } from 'react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const url = isSignup
      ? 'http://localhost:8000/api/v1/auth/register'
      : 'http://localhost:8000/api/v1/auth/login'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      // Récupérer l'id utilisateur
      const userRes = await fetch('http://localhost:8000/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        localStorage.setItem('user_id', userData.id)
      }
      window.dispatchEvent(new Event('auth:changed'))
    } else {
      alert(isSignup ? 'Sign up failed' : 'Login failed')
    }
  }

  return (
    <div className="h-full grid place-items-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80 space-y-3">
        <h1 className="text-xl font-semibold">{isSignup ? 'Create account' : 'FastChat Login'}</h1>
        <input className="w-full border p-2 rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-2 rounded" type="submit">{isSignup ? 'Create account' : 'Login'}</button>
        <button type="button" className="w-full text-blue-600 underline" onClick={() => setIsSignup(s => !s)}>
          {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  )
}


