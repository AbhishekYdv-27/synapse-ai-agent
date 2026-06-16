import { useNavigate } from "react-router-dom";
import {
  MessageSquare, BookOpen, Code2, Calculator,
  Zap, ShieldCheck, Sparkles, ArrowRight
} from "lucide-react";
import "./Landing.css";

const FEATURES = [
  { icon: <MessageSquare size={22} />, title: "Chat Mode", desc: "Casual conversation, brainstorming, and fun." },
  { icon: <BookOpen size={22} />, title: "Study Mode", desc: "Concepts explained clearly, step by step." },
  { icon: <Code2 size={22} />, title: "Coding Mode", desc: "Write, debug, and review code instantly." },
  { icon: <Calculator size={22} />, title: "Math Mode", desc: "Every problem solved with full working." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="bg-orb land-orb-1" />
      <div className="bg-orb land-orb-2" />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span>⚡</span>
          <span>Synapse AI</span>
        </div>
        <button className="nav-cta" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Powered by Llama 3.3 70B</span>
        </div>
        <h1 className="hero-title">
          One AI. <span className="gradient-text">Four ways</span> to think.
        </h1>
        <p className="hero-sub">
          Chat, learn, code, and solve — Synapse adapts its intelligence
          to exactly what you need, instantly.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Get Started Free <ArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="landing-features">
        {FEATURES.map((f, i) => (
          <div className="feature-card" key={f.title} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Trust strip */}
      <section className="landing-trust">
        <div className="trust-item"><Zap size={16} /> Ultra-fast responses</div>
        <div className="trust-item"><ShieldCheck size={16} /> Secure JWT authentication</div>
        <div className="trust-item"><Sparkles size={16} /> Free to use</div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Synapse AI. Built with React, Flask & Groq.</p>
      </footer>
    </div>
  );
}