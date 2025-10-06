export async function fetchMessages() {
  const res = await fetch('http://localhost:8000/api/v1/messages')
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}


