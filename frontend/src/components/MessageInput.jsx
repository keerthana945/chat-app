import React, { useRef, useState } from 'react';

export default function MessageInput({ onSend, onTypingStart, onTypingStop }) {
  const [text, setText] = useState('');
  const typingTimeout = useRef(null);

  function handleChange(e) {
    setText(e.target.value);
    onTypingStart();

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      onTypingStop();
    }, 1200);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    onTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={handleChange}
        maxLength={1000}
      />
      <button type="submit" disabled={!text.trim()}>
        Send
      </button>
    </form>
  );
}
