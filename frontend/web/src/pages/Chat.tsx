import { useEffect, useRef, useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState<{id?: number, content: string, sender_id?: number, created_at?: string}[]>([])
  const [input, setInput] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws?user_id=1')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }
    wsRef.current = ws
    return () => ws.close()
  }, [])

  async function sendMessage() {
    await fetch('http://localhost:8000/api/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ recipient_id: 1, content: input })
    })
    // optimistic
    setMessages(prev => [...prev, { content: input }])
    setInput('')
  }

  useEffect(() => {
    // load persisted messages
    (async () => {
      const res = await fetch('http://localhost:8000/api/v1/messages', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        // newest last
        setMessages(data.reverse())
      }
    })()
  }, [])

  return (
    <div className="h-full grid grid-rows-[auto_1fr_auto]">
      <div className="flex items-center justify-between border-b p-3">
        <div className="font-semibold">FastChat</div>
        <div className="relative">
          <button className="border px-3 py-1 rounded" onClick={() => setMenuOpen(o => !o)}>Menu</button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow w-40 z-10">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setProfileOpen(true); setMenuOpen(false) }}>Profile</button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { localStorage.removeItem('token'); window.dispatchEvent(new Event('auth:changed')) }}>Logout</button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-auto p-4 space-y-2">
        {messages.map((m, idx) => {
          const when = m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''
          return (
            <div key={idx} className="bg-gray-100 p-2 rounded">
              <div className="text-xs text-gray-500 mb-1">{m.sender_id ?? 'me'} • {when}</div>
              <div>{m.content}</div>
            </div>
          )
        })}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input className="flex-1 border p-2 rounded" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message" />
        <button className="bg-blue-600 text-white px-4 rounded" onClick={sendMessage}>Send</button>
      </div>

      {profileOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center">
          <div className="bg-white rounded p-4 w-[360px] space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Profile</div>
              <button onClick={() => setProfileOpen(false)}>✕</button>
            </div>
            <div className="space-y-2">
              <input className="w-full border p-2 rounded" placeholder="New username" value={username} onChange={e => setUsername(e.target.value)} />
              <button className="w-full bg-gray-800 text-white p-2 rounded" onClick={async () => {
                const res = await fetch('http://localhost:8000/api/v1/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ username }) })
                if (res.ok) { alert('Username updated') } else { alert('Update failed') }
              }}>Update username</button>
            </div>
            <div className="pt-3 space-y-2 border-t">
              <input className="w-full border p-2 rounded" placeholder="Current password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              <input className="w-full border p-2 rounded" placeholder="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <button className="w-full bg-blue-600 text-white p-2 rounded" onClick={async () => {
                const res = await fetch('http://localhost:8000/api/v1/users/me/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) })
                if (res.ok) { alert('Password updated') } else { alert('Password update failed') }
              }}>Change password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


