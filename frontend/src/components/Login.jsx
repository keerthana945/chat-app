import React, { useState } from 'react';

export default function Login({ onJoin }) {
  const [username, setUsername] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    onJoin(trimmed);
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Realtime Chat</h1>
        <p className="subtitle">Pick a display name to join the room</p>
        <input
          autoFocus
          type="text"
          placeholder="e.g. priya_k"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
        />
        <button type="submit" disabled={!username.trim()}>
          Join chat
        </button>
      </form>
    </div>
  );
}
