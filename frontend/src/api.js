// api.js
// Small wrapper around the REST endpoints (used for initial history load).

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export async function fetchMessages(limit = 200) {
  const res = await fetch(`${SERVER_URL}/api/messages?limit=${limit}`);
  if (!res.ok) {
    throw new Error('Failed to fetch chat history');
  }
  const data = await res.json();
  return data.messages;
}
