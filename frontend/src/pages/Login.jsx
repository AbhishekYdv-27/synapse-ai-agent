import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, setToken, setUser } from "../utils/api";
import "./Login.css";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let data;
      if (isLogin) {
        data = await authAPI.login(form.email, form.password);
      } else {
        data = await authAPI.register(
          form.username,
          form.email,
          form.password
        );
      }
      setToken(data.token);
      setUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* Animated background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">⚡</span>
          <h1 className="login-brand">Synapse AI</h1>
          <p className="login-tagline">Your intelligent thinking partner</p>
        </div>

        {/* Sign In / Sign Up tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>

          {/* Username — only on Sign Up */}
          {!isLogin && (
            <div className="field-group">
              <label className="field-label">Username</label>
              <input
                className="field-input"
                type="text"
                name="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Email</label>
            <input
              className="field-input"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete={
                isLogin ? "current-password" : "new-password"
              }
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            className="auth-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : isLogin ? (
              "Sign In →"
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        {/* Switch between login/register */}
        <p className="auth-switch">
          {isLogin
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            className="auth-switch-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

      </div>
    </div>
  );
}