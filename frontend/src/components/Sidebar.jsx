import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  historyAPI,
  removeToken,
  removeUser,
  getUser,
} from "../utils/api";
import {
  MessageSquare,
  BookOpen,
  Code2,
  Calculator,
  LayoutDashboard,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
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
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  // Reload history whenever conversation changes
  useEffect(() => {
    loadHistory();
  }, [currentConvId]);

  async function loadHistory() {
    try {
      const data = await historyAPI.getAll();
      setConversations(data.conversations || []);
    } catch {
      // silent fail
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
    } catch {
      // silent
    }
  }

  function handleLogout() {
    removeToken();
    removeUser();
    navigate("/login");
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed
          ? <ChevronRight size={16} />
          : <ChevronLeft size={16} />
        }
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        {!collapsed && <span className="logo-text">Synapse</span>}
      </div>

      {/* New Chat button */}
      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={16} />
        {!collapsed && <span>New Chat</span>}
      </button>

      {/* Dashboard link */}
      <button
        className="sidebar-nav-btn"
        onClick={() => navigate("/dashboard")}
      >
        <LayoutDashboard size={16} />
        {!collapsed && <span>Dashboard</span>}
      </button>

      {/* Chat History */}
      {!collapsed && (
        <div className="sidebar-section">

          <div className="sidebar-section-label">
            <Clock size={12} />
            <span>Recent Chats</span>
          </div>

          <div className="conv-list">
            {loading ? (
              /* Skeleton loaders */
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
                  className={`conv-item ${
                    conv.id === currentConvId ? "active" : ""
                  }`}
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

      {/* Bottom — user info + logout */}
      <div className="sidebar-bottom">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar-small">
              <User size={14} />
            </div>
            <span className="user-name">
              {user?.username || "User"}
            </span>
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}