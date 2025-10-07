import React, { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchMessages = async () => {
    const res = await fetch('http://localhost:8000/api/v1/messages', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(data.reverse())
      const myId = localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')!) : null
      // Récupérer tous les destinataires et expéditeurs sauf soi
      const userMap: Record<number, string> = {}
      data.forEach((msg: any) => {
        if (msg.sender_username && msg.sender_id !== myId) {
          userMap[msg.sender_id] = msg.sender_username
        }
        if (msg.recipient_id !== myId && msg.recipient_username) {
          userMap[msg.recipient_id] = msg.recipient_username
        }
      })
      setConversations(Object.entries(userMap).map(([id, username]) => ({ id: Number(id), username })))
      if (!recipientId && Object.keys(userMap).length > 0) {
        setRecipientId(Number(Object.keys(userMap)[0]))
      }
    }
  };

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (recipientId !== null) {
      fetchMessages();
    }
  }, [recipientId]);

  useEffect(() => {
    // Charger la liste des utilisateurs sauf soi-même
    (async () => {
      const res = await fetch('http://localhost:8000/api/v1/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        const myId = localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')!) : null
        setUsers(data.filter((u: any) => u.id !== myId))
      }
    })()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || recipientId === null) return
    const res = await fetch('http://localhost:8000/api/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ recipient_id: recipientId, content: input })
    })
    if (res.ok) {
      setInput('')
      fetchMessages()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top banner with logout button */}
      <div className="w-full flex items-center justify-end bg-gray-100 border-b p-3">
        <button className="border px-3 py-1 rounded" onClick={() => { localStorage.removeItem('token'); window.dispatchEvent(new Event('auth:changed')) }}>Déconnexion</button>
      </div>
      <div className="flex-1 grid grid-cols-[260px_1fr]">
        {/* Menu latéral conversations */}
        <div className="border-r bg-gray-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-semibold">Conversations</div>
            <button className="border rounded px-2 py-1" onClick={() => setShowNewChat(true)}>+</button>
          </div>
          <div className="flex-1 overflow-auto">
            {conversations.map((conv: {id: number, username: string}) => (
              <button key={conv.id} className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${recipientId === conv.id ? 'bg-gray-200' : ''}`} onClick={() => setRecipientId(conv.id)}>
                {conv.username}
              </button>
            ))}
          </div>
          {showNewChat && (
            <div className="p-3 border-t">
              <div className="mb-2 font-semibold">Nouveau chat</div>
              <select className="border p-2 rounded w-full" value={recipientId ?? ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRecipientId(Number(e.target.value)); setShowNewChat(false); }}>
                <option value="" disabled>Choisir destinataire</option>
                {users.map((u: {id: number, username: string}) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <button className="mt-2 w-full bg-blue-600 text-white p-2 rounded" onClick={() => setShowNewChat(false)}>Annuler</button>
            </div>
          )}
        </div>
        {/* Zone de chat, only if a conversation is selected */}
        <div className="h-full">
          {(() => {
            const myId = localStorage.getItem('user_id') ? parseInt(localStorage.getItem('user_id')!) : null;
            if (!recipientId) return null;
            return (
              <div className="h-full grid grid-rows-[auto_1fr_auto]">
                <div className="flex items-center justify-between border-b p-3">
                  <button className="border px-3 py-1 rounded mr-2" onClick={() => setRecipientId(null)}>Back</button>
                  <div className="font-semibold">{conversations.find(c => c.id === recipientId)?.username || ''}</div>
                  <div className="relative">
                    <button className="border px-3 py-1 rounded" onClick={() => setMenuOpen((o: boolean) => !o)}>Menu</button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 bg-white border rounded shadow w-40 z-10">
                        <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => { setProfileOpen(true); setMenuOpen(false) }}>Profile</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-auto p-4 space-y-2">
                  {messages
                    .filter(m => (m.sender_id === myId && m.recipient_id === recipientId) || (m.sender_id === recipientId && m.recipient_id === myId))
                    .map((m, idx) => {
                      const when = m.created_at ? new Date(m.created_at).toLocaleTimeString() : '';
                      // Always show the other user's name
                      let displayName = '';
                      if (m.sender_id === myId) {
                        // I sent the message, show recipient's name
                        displayName = m.recipient_username || '';
                      } else {
                        // I received the message, show sender's name
                        displayName = m.sender_username || '';
                      }
                      return (
                        <div key={idx} className="bg-gray-100 p-2 rounded">
                          <div className="text-xs text-gray-500 mb-1">{displayName} • {when}</div>
                          <div>{m.content}</div>
                        </div>
                      );
                    })}
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input className="flex-1 border p-2 rounded" value={input} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)} placeholder="Type a message" />
                  <button className="bg-blue-600 text-white px-4 rounded" onClick={sendMessage} disabled={!recipientId}>Send</button>
                </div>
                {profileOpen && (
                  <div className="fixed inset-0 bg-black/30 grid place-items-center">
                    <div className="bg-white rounded p-4 w-[360px] space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="font-semibold">Profile</div>
                        <button onClick={() => setProfileOpen(false)}>✕</button>
                      </div>
                      <div className="space-y-2">
                        <input className="w-full border p-2 rounded" placeholder="New username" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} />
                        <button className="w-full bg-gray-800 text-white p-2 rounded" onClick={async () => {
                          const res = await fetch('http://localhost:8000/api/v1/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ username }) })
                          if (res.ok) { alert('Username updated') } else { alert('Update failed') }
                        }}>Update username</button>
                      </div>
                      <div className="space-y-2">
                        <input className="w-full border p-2 rounded" type="password" placeholder="Old password" value={oldPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)} />
                        <input className="w-full border p-2 rounded" type="password" placeholder="New password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} />
                        <button className="w-full bg-gray-800 text-white p-2 rounded" onClick={async () => {
                          const res = await fetch('http://localhost:8000/api/v1/users/me/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) })
                          if (res.ok) { alert('Password updated') } else { alert('Update failed') }
                        }}>Update password</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}