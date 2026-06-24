import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  historyAPI,
  removeToken,
  removeUser,
  getUser,
} from "../utils/api";
import {
  MessageSquare, BookOpen, Code2, Calculator,
  LayoutDashboard, Trash2, LogOut, ChevronLeft,
  ChevronRight, Plus, Clock, User, X
} from "lucide-react";

const MODE_ICONS = {
  chat:   <MessageSquare size={14} />,
  study:  <BookOpen size={14} />,
  coding: <Code2 size={14} />,
  math:   <Calculator size={14} />,
};

export default function Sidebar({
  activeMode,
  onSelectConversation,
  onNewChat,
  currentConvId,
  mobileOpen,
  onMobileClose,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    loadHistory();
  }, [currentConvId]);

  async function loadHistory() {
    try {
      const data = await historyAPI.getAll();
      setConversations(data.conversations || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    await historyAPI.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleSelectConv(conv) {
    try {
      const data = await historyAPI.getOne(conv.id);
      onSelectConversation(data.conversation);
      onMobileClose?.(); // close sidebar on mobile after selecting
    } catch {
      // silent
    }
  }

  function handleLogout() {
    removeToken();
    removeUser();
    navigate("/login");
  }

  function handleNewChat() {
    onNewChat();
    onMobileClose?.(); // close on mobile
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMobileClose}
        />
      )}

      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>

        {/* Desktop collapse toggle */}
        <button
          className="sidebar-toggle desktop-only"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close button */}
        <button
          className="sidebar-toggle mobile-only"
          onClick={onMobileClose}
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          {!collapsed && <span className="logo-text">Synapse</span>}
        </div>

        {/* New Chat */}
        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={16} />
          {!collapsed && <span>New Chat</span>}
        </button>

        {/* Dashboard */}
        <button
          className="sidebar-nav-btn"
          onClick={() => { navigate("/dashboard"); onMobileClose?.(); }}
        >
          <LayoutDashboard size={16} />
          {!collapsed && <span>Dashboard</span>}
        </button>

        {/* Profile */}
        <button
          className="sidebar-nav-btn"
          onClick={() => { navigate("/profile"); onMobileClose?.(); }}
        >
          <User size={16} />
          {!collapsed && <span>Profile</span>}
        </button>

        {/* History */}
        {!collapsed && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">
              <Clock size={12} />
              <span>Recent Chats</span>
            </div>
            <div className="conv-list">
              {loading ? (
                <div className="conv-loading">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="conv-skeleton" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <p className="conv-empty">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conv-item ${conv.id === currentConvId ? "active" : ""}`}
                    onClick={() => handleSelectConv(conv)}
                  >
                    <span className="conv-mode-icon">
                      {MODE_ICONS[conv.mode] || <MessageSquare size={14} />}
                    </span>
                    <span className="conv-title">{conv.title}</span>
                    <button
                      className="conv-delete"
                      onClick={(e) => handleDelete(e, conv.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="sidebar-user">
              <div className="user-avatar-small">
                <User size={14} />
              </div>
              <span className="user-name">{user?.username || "User"}</span>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>
    </>
  );
}