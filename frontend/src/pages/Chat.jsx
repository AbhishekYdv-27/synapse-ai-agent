import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Plus,
  MessageSquare,
  BookOpen,
  Code2,
  Calculator,
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
  chat:   ["Tell me a joke 😄", "What's something interesting?", "Play 20 questions with me"],
  study:  ["Explain quantum entanglement", "How does the brain store memories?", "What is recursion?"],
  coding: ["Write a REST API in Python", "Explain Big O notation", "Debug my JavaScript code"],
  math:   ["Solve x² + 5x + 6 = 0", "Integrate sin(x)dx", "Explain Pythagorean theorem"],
};

export default function Chat() {
  const { mode = "chat" } = useParams();
  const navigate = useNavigate();
  const modeConfig = MODE_CONFIG[mode] || MODE_CONFIG.chat;

  const {
    messages,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    sendMessage,
    loadConversation,
    resetChat,
  } = useChat(mode);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    // Reset textarea height
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
    // Auto grow textarea
    e.target.style.height = "auto";
    e.target.style.height =
      Math.min(e.target.scrollHeight, 140) + "px";
  }

  function handleNewChat() {
    resetChat();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    inputRef.current?.focus();
  }

  function handleSuggestion(text) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="chat-layout">

      {/* Sidebar */}
      <Sidebar
        activeMode={mode}
        onSelectConversation={loadConversation}
        onNewChat={handleNewChat}
        currentConvId={conversationId}
      />

      {/* Main chat area */}
      <div className="chat-main">

        {/* ── Top bar ── */}
        <header className="chat-topbar">
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
            <span>
              {conversationTitle || modeConfig.label}
            </span>
          </div>

          <button className="new-chat-top-btn" onClick={handleNewChat}>
            <Plus size={15} />
            <span>New</span>
          </button>
        </header>

        {/* ── Messages area ── */}
        <div className="messages-area">

          {messages.length === 0 ? (
            /* Empty / welcome state */
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
                {mode === "chat" &&
                  "I'm ready to chat, joke around, or talk about anything."}
                {mode === "study" &&
                  "Ask me to explain any concept — I'll teach it step by step."}
                {mode === "coding" &&
                  "Paste your code, describe a bug, or ask me to build something."}
                {mode === "math" &&
                  "Give me any math problem and I'll walk through every step."}
              </p>

              {/* Suggestion chips */}
              <div className="suggestion-chips">
                {SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    style={{ "--chip-color": modeConfig.color }}
                    onClick={() => handleSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* Message list */
            <div className="message-list">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing animation */}
              {isLoading && <TypingIndicator />}

              {/* Error */}
              {error && (
                <div className="chat-error">
                  ⚠️ {error}
                  <button
                    onClick={() =>
                      sendMessage(
                        messages[messages.length - 2]?.content || ""
                      )
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

        {/* ── Input bar ── */}
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