# Realtime Chat App

A real-time chat application built with **React (Vite)** on the frontend and
**Node.js + Express + Socket.io** on the backend, with chat history persisted
in **SQLite**.

## Project structure

```
chat-app/
├── backend/
│   ├── server.js        # Express REST API + Socket.io server
│   ├── db.js             # SQLite persistence layer (better-sqlite3)
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx              # Top-level state + socket wiring
    │   ├── socket.js             # Shared socket.io-client instance
    │   ├── api.js                 # REST call for chat history
    │   ├── styles.css
    │   └── components/
    │       ├── Login.jsx          # Dummy username-based "login"
    │       ├── MessageList.jsx
    │       ├── MessageInput.jsx   # Sends messages + typing events
    │       └── OnlineUsers.jsx    # Online/offline presence sidebar
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

## Prerequisites

- Node.js 18+ and npm

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The server starts on `http://localhost:4000` (configurable via `.env`).
A `chat.db` SQLite file is created automatically in `backend/` on first run.

### Backend environment variables

| Variable        | Description                              | Default                 |
|-----------------|-------------------------------------------|--------------------------|
| `PORT`          | Port the Express/Socket.io server listens on | `4000`                |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend       | `http://localhost:5173` |
| `DB_PATH`       | Path to the SQLite database file           | `./chat.db`              |

## Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

### Frontend environment variables

| Variable          | Description                    | Default                 |
|-------------------|----------------------------------|--------------------------|
| `VITE_SERVER_URL` | Base URL of the backend server   | `http://localhost:4000` |

## Using the app

1. Open the app in two browser tabs (or two devices on the same network).
2. Enter a display name in each tab — this is a **dummy login**, no password
   or account is required.
3. Send a message in one tab; it appears instantly in the other via Socket.io.
4. Refresh a tab — previous messages reload from the backend via the
   `GET /api/messages` REST endpoint, so history survives refreshes and
   server restarts (it's on disk in SQLite).
5. Start typing to see the typing indicator appear for other users.
6. The left sidebar shows who is currently online.

## REST API

| Method | Endpoint         | Description                          |
|--------|------------------|----------------------------------------|
| GET    | `/api/health`    | Health check                            |
| GET    | `/api/messages`  | Fetch chat history (`?limit=` optional) |
| POST   | `/api/messages`  | Send a message (`{ username, text }`)   |

## Socket.io events

| Event              | Direction        | Payload                              |
|---------------------|------------------|----------------------------------------|
| `user:join`         | client → server  | `username` (string)                     |
| `chat:message`      | both directions   | `{ username, text }` / saved message row |
| `typing:start`      | client → server  | `username`                              |
| `typing:stop`       | client → server  | `username`                              |
| `typing:update`     | server → client  | `{ username, isTyping }`               |
| `presence:update`   | server → client  | array of online usernames               |
| `presence:notice`   | server → client  | join/leave text notice                  |

## Design decisions

- **Socket.io is the source of truth for real-time delivery.** The server
  broadcasts every saved message back to all clients (including the sender),
  so the UI always renders from the row that was actually persisted, rather
  than trusting client-side optimistic state.
- **A REST `POST /api/messages` endpoint is also implemented** and broadcasts
  over the socket too, satisfying the "Send messages" REST requirement
  independently of the socket path, and making the API usable by non-socket
  clients (e.g. a script or Postman).
- **SQLite via `better-sqlite3`** was chosen over MongoDB for the bonus
  persistence requirement because it needs no external database server —
  it's a single file, which keeps setup to `npm install` with nothing else
  to run or configure.
- **Presence and typing state are kept in memory** (`Map` on the server),
  not persisted — this is ephemeral, connection-scoped state, unlike chat
  history which needs to survive refreshes and restarts.
- **Dummy auth** is just a username with no password, per the bonus
  requirement's own wording ("dummy authentication"). It's stored only in
  React state on the client, not persisted server-side as an account.

## Assumptions

- This is a single shared chat room (no multiple rooms/DMs), matching the
  scope described in the task.
- "Online/offline status" is shown as a live list of currently connected
  usernames rather than per-user last-seen timestamps.
- No message editing/deletion was required, so it isn't implemented.
- CORS is left permissive enough for local development; tighten
  `CLIENT_ORIGIN` before any real deployment.

## Deployment (optional bonus)

To deploy the backend (e.g. on Render or Railway):
1. Push `backend/` to its own repo (or point the platform at the `backend`
   subdirectory).
2. Set `CLIENT_ORIGIN` to your deployed frontend's URL.
3. Note that `better-sqlite3` writes to local disk — on platforms with
   ephemeral filesystems, data will not persist across deploys/restarts
   unless you attach a persistent volume, or swap in a managed database.
4. Set `VITE_SERVER_URL` in the frontend's `.env` to the deployed backend URL
   before building (`npm run build`) and deploying the frontend (e.g. to
   Vercel/Netlify).
