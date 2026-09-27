// db.js
// Thin wrapper around a local SQLite database used to persist chat history.
// Using better-sqlite3 keeps things simple and synchronous (no callback/promise
// plumbing needed for a small chat history table), which is fine for a
// single-process demo app like this.

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'chat.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL
  );
`);

const insertMessageStmt = db.prepare(
  'INSERT INTO messages (username, text, timestamp) VALUES (?, ?, ?)'
);

const getAllMessagesStmt = db.prepare(
  'SELECT id, username, text, timestamp FROM messages ORDER BY id ASC'
);

const getRecentMessagesStmt = db.prepare(
  'SELECT id, username, text, timestamp FROM messages ORDER BY id DESC LIMIT ?'
);

function saveMessage({ username, text, timestamp }) {
  const info = insertMessageStmt.run(username, text, timestamp);
  return { id: info.lastInsertRowid, username, text, timestamp };
}

function getAllMessages() {
  return getAllMessagesStmt.all();
}

function getRecentMessages(limit = 100) {
  // Returned newest-first from SQL; reverse so the caller gets chronological order.
  return getRecentMessagesStmt.all(limit).reverse();
}

module.exports = {
  saveMessage,
  getAllMessages,
  getRecentMessages,
};
