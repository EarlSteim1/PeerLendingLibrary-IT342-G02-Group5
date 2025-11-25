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
    <div
      className="login-container"
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Top-left book icon + brand text */}
         <div className="app-top-left-icon" aria-hidden="true">
        <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" alt="Book icon" />
        <span className="app-brand-text">PEER READS</span>
      </div>
      
      {/* LEFT SIDE */}
      <div
        className="left login-left"
        style={{
          flex: 1,
          height: "100%",
          backgroundColor: "#f7faff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="logo"
          style={{ marginBottom: "30px", textAlign: "center", color: "#2ecc71" }}
        >
          <h1 style={{ margin: 0 }}></h1>
        </div>
        <h3 style={{ color: "#555", textAlign: "center" }}>
   
        </h3>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="right"
        style={{
          flex: 1,
          height: "100%",
          overflowY: "auto",
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="form-box" style={{ width: "100%", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "30px", textAlign: "center" }}>Welcome Back</h2>

          <form onSubmit={handleStandardSubmit} id="login-form">
            <div className="input-group" style={{ marginBottom: "20px", position: "relative" }}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <span
                className="input-icon"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  color: "#888",
                  userSelect: "none",
                }}
              >
                
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: "20px", position: "relative" }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 14px",
                  fontSize: "16px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <span
                className="input-icon"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "18px",
                  color: "#888",
                  userSelect: "none",
                }}
              >
                
              </span>
            </div>

            <div className="remember" style={{ marginBottom: "25px" }}>
              <input
                type="checkbox"
                id="remember"
                disabled={loading}
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="remember" style={{ userSelect: "none" }}>
                Remember me
              </label>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <button
              type="submit"
              form="login-form"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 14px",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                fontWeight: "600",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = "#007bff")}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = "#007bff")}
            >
              {loading ? "Logging In..." : "Log In"}
            </button>

            <button
              type="button"
              className="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 14px",
                fontSize: "16px",
                background: "white",
                color: "var(--text-dark, #333)",
                border: "1px solid #ccc",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: "600",
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google logo"
                style={{ width: "18px", height: "18px" }}
              />
              Google
            </button>
          </div>

          <p className="link-text" style={{ textAlign: "center", marginBottom: "25px" }}>
            Don’t have an account? <Link to="/register">Register</Link>
          </p>

          <div className="demo-credentials" aria-hidden>
            <strong>Demo Credentials</strong>
            <div className="cred-row"><span>Admin</span><code>admin@peerreads.local</code><span>•</span><code>admin123</code></div>
            <div className="cred-row"><span>User</span><code>user@gmail.com</code><span>•</span><code>user123</code></div>
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
