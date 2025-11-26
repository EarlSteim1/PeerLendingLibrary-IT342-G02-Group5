import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import apiClient from "../api/client";
import "../css/global.css";
import "../css/Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const navigate = useNavigate();

  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      showToastNotification("Please enter your username", "error");
      return;
    }

    if (!password.trim()) {
      showToastNotification("Please enter your password", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        usernameOrEmail: username.trim(),
        password: password,
      });

      StorageService.saveSession(response);

      showToastNotification("Login successful! Welcome back.", "success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (error) {
      console.error("Login Error:", error);
      showToastNotification(
        error.message || "An error occurred during login. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = () => {
      showToastNotification("Google login feature coming soon!", "info");
  };

  return (
    <div className="centered-page-wrapper">
      {/* Top-left book icon + brand text */}
      <div className="app-top-left-icon" aria-hidden="true">
        <img
          src="https://cdn-icons-png.flaticon.com/512/29/29302.png"
          alt="Book icon"
        />
        <span className="app-brand-text">PEER READS</span>
      </div>

      <div className="login-container">
        {/* LEFT SIDE */}
        <div className="left login-left">
          <div className="login-overlay" />
          <div className="left-content">
            <h1>Borrow, Share, Discover.</h1>
            <p>
              Join a community-powered library. Lend your books, track your
              reads, and discover titles from people around you.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right">
          <div className="form-box">
            <h2>Welcome back</h2>
            <p className="auth-subtitle">
              Sign in to your personal lending library and pick up where you left off.
            </p>

            <form onSubmit={handleStandardSubmit} id="login-form">
              <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
              </div>

              <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              </div>

              <div className="remember">
              <input
                type="checkbox"
                id="remember"
                disabled={loading}
              />
              <label htmlFor="remember" style={{ userSelect: "none" }}>
                Remember me
              </label>
              </div>
            </form>

            <div className="auth-button-row">
              <button
                type="submit"
                form="login-form"
                disabled={loading}
                className="primary-btn"
              >
                {loading ? "Logging In..." : "Log In"}
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <button
                type="button"
                className="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google logo"
                  style={{ width: "18px", height: "18px" }}
                />
                Google
              </button>
            </div>

            <p className="link-text">
              Don’t have an account? <Link to="/register">Register</Link>
            </p>

            <div className="demo-credentials" aria-hidden>
              <strong>Demo Credentials</strong>
              <div className="cred-row">
                <span>Admin</span>
                <code>admin@peerreads.local</code>
                <span>•</span>
                <code>admin123</code>
              </div>
              <div className="cred-row">
                <span>User</span>
                <code>user@gmail.com</code>
                <span>•</span>
                <code>user123</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

export default Login;
