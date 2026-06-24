import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send, ArrowLeft, Plus, MessageSquare,
  BookOpen, Code2, Calculator, Menu
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import { useChat } from "../hooks/useChat";
import "./Chat.css";

const MODE_CONFIG = {
  chat: {
    label: "Chat Mode",
    icon: <MessageSquare size={16} />,
    color: "#6347ff",
    placeholder: "Ask me anything...",
  },
  study: {
    label: "Study Mode",
    icon: <BookOpen size={16} />,
    color: "#00c6ac",
    placeholder: "What would you like to learn?",
  },
  coding: {
    label: "Coding Mode",
    icon: <Code2 size={16} />,
    color: "#f39c12",
    placeholder: "Describe your coding problem...",
  },
  math: {
    label: "Math Mode",
    icon: <Calculator size={16} />,
    color: "#e74c3c",
    placeholder: "Enter a math problem to solve...",
  },
};

const SUGGESTIONS = {
  chat:   ["Tell me a joke 😄", "What's something interesting?", "Play 20 questions"],
  study:  ["Explain quantum entanglement", "How does memory work?", "What is recursion?"],
  coding: ["Write a REST API in Python", "Explain Big O notation", "Debug my JS code"],
  math:   ["Solve x² + 5x + 6 = 0", "Integrate sin(x)dx", "Pythagorean theorem"],
};

export default function Chat() {
  const { mode = "chat" } = useParams();
  const navigate = useNavigate();
  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.chat;

  const {
    messages, isLoading, error,
    conversationId, conversationTitle,
    sendMessage, loadConversation, resetChat,
  } = useChat(mode);

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar state
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaChange(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  function handleNewChat() {
    resetChat();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }

  return (
    <div className="chat-layout">

      {/* Sidebar with mobile support */}
      <Sidebar
        activeMode={mode}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        currentConvId={conversationId}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="chat-main">

        {/* Topbar */}
        <header className="chat-topbar">

          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <button
            className="back-btn"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </button>

          <div
            className="chat-mode-badge"
            style={{ "--mode-color": modeConfig.color }}
          >
            {modeConfig.icon}
            <span>{conversationTitle || modeConfig.label}</span>
          </div>

          <button className="new-chat-top-btn" onClick={handleNewChat}>
            <Plus size={15} />
            <span>New</span>
          </button>
        </header>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div
                className="welcome-icon"
                style={{
                  background: `${modeConfig.color}18`,
                  borderColor: `${modeConfig.color}40`,
                }}
              >
                <span style={{ color: modeConfig.color }}>
                  {modeConfig.icon}
                </span>
              </div>
              <h2 className="welcome-title">{modeConfig.label}</h2>
              <p className="welcome-sub">
                {mode === "chat" && "I'm ready to chat, joke around, or talk about anything."}
                {mode === "study" && "Ask me to explain any concept — I'll teach it step by step."}
                {mode === "coding" && "Paste your code, describe a bug, or ask me to build something."}
                {mode === "math" && "Give me any math problem and I'll walk through every step."}
              </p>
              <div className="suggestion-chips">
                {SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    style={{ "--chip-color": modeConfig.color }}
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              {error && (
                <div className="chat-error">
                  ⚠️ {error}
                  <button
                    onClick={() =>
                      sendMessage(messages[messages.length - 2]?.content || "")
                    }
                  >
                    Retry
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <div
            className="input-wrapper"
            style={{ "--mode-color": modeConfig.color }}
          >
            <textarea
              ref={(el) => {
                inputRef.current = el;
                textareaRef.current = el;
              }}
              className="chat-input"
              rows={1}
              placeholder={modeConfig.placeholder}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ background: modeConfig.color }}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="input-hint">
            Enter to send · Shift + Enter for new line
          </p>
        </div>

      </div>
    </div>
  );
}