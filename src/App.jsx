import { useState, useRef, useEffect } from "react";
import "./App.css";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SUGGESTIONS = ["👋 Say hello", "🌍 Where is Mount Everest?", "😂 Tell me a joke", "💡 What can you do?"];

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hello! I'm NexusAI 👋 Ask me anything!", time: getTime() }
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;

    const userMsg = { id: Date.now(), from: "user", text: msg, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const history = messages
  .filter(m => !(m.from === "bot" && m.id === 1))
  .map(m => ({
    role: m.from === "user" ? "user" : "assistant",
    content: m.text
  }));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are NexusAI, a helpful, friendly, and intelligent assistant. Keep responses concise and clear. Use emojis occasionally to be friendly."
            },
            ...history,
            { role: "user", content: msg }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Try again! 🔄";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: "bot",
        text: botReply,
        time: getTime()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: "bot",
        text: "Oops! Something went wrong. Check your connection 🔌",
        time: getTime()
      }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="app">
      <div className="dot-grid" />

      <div className="chat-window">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="avatar">✦</div>
            <div className="header-info">
              <span className="header-name">NexusAI</span>
              <div className="header-status">
                <span className={`status-dot ${typing ? "thinking" : ""}`} />
                <span>{typing ? "Thinking..." : "Online"}</span>
              </div>
            </div>
          </div>
          <span className="model-tag">Llama 3</span>
        </header>

        {/* Messages */}
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`msg-row ${msg.from}`}>
              <div className="msg-avatar">
                {msg.from === "bot" ? "✦" : "👤"}
              </div>
              <div className="bubble">
                {msg.text}
                <span className="bubble-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="msg-row bot">
              <div className="msg-avatar">✦</div>
              <div className="bubble">
                <div className="typing-bubble">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion-btn" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <input
              className="chat-input"
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={typing}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={typing}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}