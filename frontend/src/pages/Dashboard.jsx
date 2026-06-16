import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/api";
import {
  MessageSquare,
  BookOpen,
  Code2,
  Calculator,
} from "lucide-react";
import "./Dashboard.css";

const MODES = [
  {
    id: "chat",
    icon: <MessageSquare size={28} />,
    label: "Chat Mode",
    desc: "Casual conversation, jokes, brainstorming — your friendly AI companion.",
    color: "mode-chat",
    gradient: "linear-gradient(135deg, #6347ff 0%, #9b59b6 100%)",
    glow: "rgba(99, 71, 255, 0.35)",
  },
  {
    id: "study",
    icon: <BookOpen size={28} />,
    label: "Study Mode",
    desc: "Deep explanations, concept breakdowns, and guided learning for any topic.",
    color: "mode-study",
    gradient: "linear-gradient(135deg, #00c6ac 0%, #2ecc71 100%)",
    glow: "rgba(0, 198, 172, 0.35)",
  },
  {
    id: "coding",
    icon: <Code2 size={28} />,
    label: "Coding Mode",
    desc: "Write, debug, and review code with syntax highlighting and best practices.",
    color: "mode-coding",
    gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
    glow: "rgba(243, 156, 18, 0.35)",
  },
  {
    id: "math",
    icon: <Calculator size={28} />,
    label: "Math Mode",
    desc: "Step-by-step solutions from arithmetic to calculus. Every step explained.",
    color: "mode-math",
    gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
    glow: "rgba(231, 76, 60, 0.35)",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="dashboard-page">

      {/* Background orbs */}
      <div className="bg-orb dash-orb-1" />
      <div className="bg-orb dash-orb-2" />

      <div className="dashboard-container">

        {/* ── Header ── */}
        <header className="dash-header">
          <div className="dash-logo">
            <span className="dash-logo-icon">⚡</span>
            <span className="dash-brand">Synapse AI</span>
          </div>
          <div className="dash-user-info">
            <div className="dash-avatar">
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="dash-username">
              {user?.username || "User"}
            </span>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="dash-hero">
          <p className="dash-greeting">
            {greeting}, {user?.username || "there"} 👋
          </p>
          <h1 className="dash-headline">
            What are we working on today?
          </h1>
          <p className="dash-subline">
            Choose a mode below and start a conversation with your AI.
          </p>
        </section>

        {/* ── Mode Cards Grid ── */}
        <div className="modes-grid">
          {MODES.map((mode, i) => (
            <button
              key={mode.id}
              className={`mode-card ${mode.color}`}
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => navigate(`/chat/${mode.id}`)}
            >
              {/* Glow effect on hover */}
              <div
                className="card-glow"
                style={{ background: mode.glow }}
              />

              {/* Icon */}
              <div
                className="mode-icon-wrap"
                style={{ background: mode.gradient }}
              >
                {mode.icon}
              </div>

              {/* Text */}
              <div className="mode-info">
                <h3 className="mode-label">{mode.label}</h3>
                <p className="mode-desc">{mode.desc}</p>
              </div>

              {/* Arrow */}
              <span className="mode-arrow">→</span>
            </button>
          ))}
        </div>

        {/* ── Stats Bar ── */}
        
        <div className="dash-stats">
          <div className="stat-item">
            <span className="stat-icon">🧑</span>
            <span className="stat-text">Created By Synapse Team </span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-icon">🧠</span>
            <span className="stat-text">
              Powered by Llama 3.3 70B
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <span className="stat-text">fast responses Unlimited Conversation </span>
          </div>
        </div>

      </div>
    </div>
  );
}