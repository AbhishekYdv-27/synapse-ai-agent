import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Lock, LogOut,
  CheckCircle, AlertCircle
} from "lucide-react";
import {
  getUser, setUser,
  removeToken, removeUser,
  profileAPI
} from "../utils/api";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const user = getUser();

  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const data = await profileAPI.update(username);
      setUser(data.user);
      setProfileMsg({ type: "success", text: "Username updated successfully!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await profileAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleLogout() {
    removeToken();
    removeUser();
    navigate("/login");
  }

  return (
    <div className="profile-page">
      <div className="bg-orb profile-orb-1" />
      <div className="bg-orb profile-orb-2" />

      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </button>
          <h1 className="profile-title">My Profile</h1>
        </div>

        {/* Avatar card */}
        <div className="profile-avatar-card">
          <div className="profile-big-avatar">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="profile-avatar-info">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
            <span className="profile-badge">⚡ Synapse Member</span>
          </div>
        </div>

        {/* Edit username */}
        <div className="profile-card">
          <div className="profile-card-header">
            <User size={18} />
            <h3>Edit Username</h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="profile-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                minLength={3}
                required
              />
            </div>
            {profileMsg && (
              <div className={`profile-msg ${profileMsg.type}`}>
                {profileMsg.type === "success"
                  ? <CheckCircle size={14} />
                  : <AlertCircle size={14} />
                }
                {profileMsg.text}
              </div>
            )}
            <button
              className="profile-save-btn"
              type="submit"
              disabled={profileLoading}
            >
              {profileLoading ? (
                <span className="btn-spinner" />
              ) : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="profile-card">
          <div className="profile-card-header">
            <Lock size={18} />
            <h3>Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="profile-field">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="profile-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                minLength={6}
                required
              />
            </div>
            {passwordMsg && (
              <div className={`profile-msg ${passwordMsg.type}`}>
                {passwordMsg.type === "success"
                  ? <CheckCircle size={14} />
                  : <AlertCircle size={14} />
                }
                {passwordMsg.text}
              </div>
            )}
            <button
              className="profile-save-btn"
              type="submit"
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <span className="btn-spinner" />
              ) : "Change Password"}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="profile-card">
          <div className="profile-card-header">
            <AlertCircle size={18} />
            <h3>Account Info</h3>
          </div>
          <div className="profile-info-row">
            <span>Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="profile-info-row">
            <span>Member since</span>
            <span>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
          <div className="profile-info-row">
            <span>Plan</span>
            <span className="plan-badge">Free</span>
          </div>
        </div>

        {/* Logout */}
        <button className="profile-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout from Synapse AI</span>
        </button>

      </div>
    </div>
  );
}