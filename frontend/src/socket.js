// socket.js
// Single shared socket.io-client instance used across the app.

import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// autoConnect: false lets us connect only once the user has picked a username.
export const socket = io(SERVER_URL, {
  autoConnect: false,
});
