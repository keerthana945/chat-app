import React from 'react';

export default function OnlineUsers({ users, currentUser }) {
  return (
    <div className="online-users">
      <h3>Online ({users.length})</h3>
      <ul>
        {users.map((u) => (
          <li key={u}>
            <span className="status-dot" />
            {u} {u === currentUser && <span className="you-tag">(you)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
