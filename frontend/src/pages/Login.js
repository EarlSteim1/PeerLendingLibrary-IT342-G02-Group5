import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/global.css";
import "../css/Login.css"; 

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ⚡️ SIMULATION: Replace this block with your actual API call
    try {
        // Simulating network delay for backend processing
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        // In a real app, you'd check API response for success/failure
        // For now, we assume success:
        console.log(`Login attempt successful for user: ${username}`);
        
        // Redirect to the dashboard
        navigate("/dashboard"); 

    } catch (error) {
        // Handle network errors or unexpected issues
        console.error("Login Error:", error);
        alert("An error occurred during login. Please try again.");
    } finally {
        setLoading(false);
    }
  };
  
  const handleGoogleLogin = () => {
      alert("Redirecting to Google login (feature coming soon)");
  };

  return (
    <div className="centered-page-wrapper">
        <div className="login-container">
          
          {/* LEFT SIDE: Login Illustration */}
          <div className="left">
            <div className="logo">
              <img src="https://cdn-icons-png.flaticon.com/512/3004/3004613.png" alt="Peer Reads Logo"/>
              <h1>Peer Reads</h1>
            </div>
            <img src="https://via.placeholder.com/400x250/f7faff?text=Reading+Community+Illustration" alt="Reading illustration" className="illustration"/>
            <h3>Share stories, build community</h3>
          </div>

          {/* RIGHT SIDE: Login Form */}
          <div className="right">
            <div className="form-box">
              <h2>Welcome Back</h2>
              
              {/* --- Standard Login Form Inputs --- */}
              <form onSubmit={handleStandardSubmit} id="login-form">
                
                {/* 1. Username Input Group */}
                <div className="input-group">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        disabled={loading}
                    />
                    <span className="input-icon">👤</span> 
                </div>

                {/* 2. Password Input Group */}
                <div className="input-group">
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        disabled={loading}
                    />
                    <span className="input-icon">🔒</span> 
                </div>

                <div className="remember">
                  <input type="checkbox" id="remember" disabled={loading} />
                  <label htmlFor="remember">Remember me</label>
                </div>
              </form>
              
              {/* --- Button Container with Inline Flexbox Styles for Alignment --- */}
              <div 
                  style={{
                      display: 'flex', 
                      gap: '15px', 
                      marginTop: '-20px', 
                      marginBottom: '30px'
                  }}
              >
                  {/* Standard Log In Button */}
                  <button 
                      type="submit" 
                      form="login-form" 
                      disabled={loading}
                      style={{ 
                          flex: 1, 
                          padding: '10px 14px', 
                          fontSize: '15px',
                          width: 'auto',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                      }} 
                  >
                      {loading ? 'Logging In...' : 'Log In'}
                  </button>

                  {/* Google Login Button */}
                  <button 
                      type="button" 
                      className="google-login-btn" 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      style={{ 
                          flex: 1, 
                          padding: '10px 14px', 
                          fontSize: '15px', 
                          background: 'white',
                          color: 'var(--text-dark)',
                          border: '1px solid var(--border-color)',
                          width: 'auto',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.7 : 1,
                      }}
                  >
                      <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                          alt="Google logo" 
                          className="google-icon"
                          style={{width: '18px', height: '18px', marginRight: '8px'}} 
                      />
                      Google
                  </button>
              </div>

              <p className="link-text" style={{textAlign: 'center'}}>
                Don’t have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </div>
        </div>
    </div>
  );
}

export default Login;