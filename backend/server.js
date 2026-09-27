// server.js
// Express REST API + Socket.io real-time layer for the chat app.

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { saveMessage, getRecentMessages } = require('./db');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

// ---- In-memory presence state (not persisted; resets on server restart) ----
// Map<socket.id, { username }>
const onlineUsers = new Map();

function broadcastOnlineUsers() {
  const usernames = [...new Set([...onlineUsers.values()].map((u) => u.username))];
  io.emit('presence:update', usernames);
}

// -------------------------- REST API --------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fetch chat history
app.get('/api/messages', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const messages = getRecentMessages(limit);
    res.json({ messages });
  } catch (err) {
    console.error('Failed to fetch messages:', err);
    res.status(500).json({ error: 'Could not fetch chat history.' });
  }
});

// Send a message over REST (in addition to the socket path, so the API
// requirement is satisfied independently of the socket connection).
app.post('/api/messages', (req, res) => {
  try {
    const { username, text } = req.body || {};

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'username is required.' });
    }
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required.' });
    }

    const message = saveMessage({
      username: username.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all connected clients so REST-sent messages also show up live.
    io.emit('chat:message', message);

    res.status(201).json({ message });
  } catch (err) {
    console.error('Failed to save message:', err);
    res.status(500).json({ error: 'Could not save message.' });
  }
});

// -------------------------- Socket.io --------------------------

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('user:join', (username) => {
    if (!username || typeof username !== 'string') return;
    onlineUsers.set(socket.id, { username: username.trim() });
    broadcastOnlineUsers();
    socket.broadcast.emit('presence:notice', `${username.trim()} joined the chat`);
  });

  socket.on('chat:message', (payload) => {
    try {
      const { username, text } = payload || {};
      if (!username || !text || !text.trim()) return;

      const message = saveMessage({
        username: username.trim(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
      });

      // Broadcast to everyone, including sender, so all clients render from
      // a single source of truth returned by the server.
      io.emit('chat:message', message);
    } catch (err) {
      console.error('Error handling chat:message:', err);
      socket.emit('chat:error', 'Message could not be delivered.');
    }
  });

  socket.on('typing:start', (username) => {
    socket.broadcast.emit('typing:update', { username, isTyping: true });
  });

  socket.on('typing:stop', (username) => {
    socket.broadcast.emit('typing:update', { username, isTyping: false });
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    broadcastOnlineUsers();
    if (user) {
      socket.broadcast.emit('presence:notice', `${user.username} left the chat`);
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Chat server listening on port ${PORT}`);
});
