import React, { useCallback, useEffect, useState } from 'react';
import { socket } from './socket';
import { fetchMessages } from './api';
import Login from './components/Login';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import OnlineUsers from './components/OnlineUsers';

export default function App() {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Load chat history via REST once we know who the user is, then connect
  // the socket for live updates.
  useEffect(() => {
    if (!username) return;

    let cancelled = false;

    fetchMessages()
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setConnectionError('Could not load chat history.');
      });

    socket.connect();
    socket.emit('user:join', username);

    function handleIncoming(message) {
      setMessages((prev) => [...prev, message]);
    }

    function handlePresenceUpdate(users) {
      setOnlineUsers(users);
    }

    function handlePresenceNotice(text) {
      // Lightweight system notice shown as a temporary console log; could be
      // rendered inline in the message list if desired.
      console.log(text);
    }

    function handleTypingUpdate({ username: who, isTyping }) {
      setTypingUser(isTyping ? who : null);
    }

    function handleConnectError(err) {
      console.error('Socket connection error:', err);
      setConnectionError('Realtime connection failed. Retrying...');
    }

    function handleConnect() {
      setConnectionError(null);
    }

    socket.on('connect', handleConnect);
    socket.on('chat:message', handleIncoming);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('presence:notice', handlePresenceNotice);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('connect_error', handleConnectError);

    return () => {
      cancelled = true;
      socket.off('connect', handleConnect);
      socket.off('chat:message', handleIncoming);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('presence:notice', handlePresenceNotice);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [username]);

  const handleSend = useCallback(
    (text) => {
      socket.emit('chat:message', { username, text });
    },
    [username]
  );

  const handleTypingStart = useCallback(() => {
    socket.emit('typing:start', username);
  }, [username]);

  const handleTypingStop = useCallback(() => {
    socket.emit('typing:stop', username);
  }, [username]);

  if (!username) {
    return <Login onJoin={setUsername} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <OnlineUsers users={onlineUsers} currentUser={username} />
      </aside>
      <main className="chat-panel">
        <header className="chat-header">
          <h2>Team Chat</h2>
          {connectionError && <span className="error-banner">{connectionError}</span>}
        </header>
        <MessageList messages={messages} currentUser={username} />
        <div className="typing-indicator">
          {typingUser ? `${typingUser} is typing...` : '\u00A0'}
        </div>
        <MessageInput
          onSend={handleSend}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </main>
    </div>
  );
}
