import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import "../css/global.css"; 
import "../css/Login.css"; 

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = "Emails do not match";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Registering:", formData);
      
      // Create user account (store users list) and save profile
      const created = StorageService.addUser({
        username: formData.email.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.name.trim(),
        profile: {
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          location: "Philippines",
          bio: "Welcome to Peer Reads!",
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          profilePicture: "https://via.placeholder.com/120/ADD8E6/000000?text=👤",
        }
      });

      if (!created) {
        showToastNotification('An account with that email already exists.', 'error');
        setLoading(false);
        return;
      }

      // Set session for the newly created user
      StorageService.setUserSession(created.username);
      StorageService.saveUserProfile(created.profile);
      
      showToastNotification(`Registration successful! Welcome, ${formData.name}!`, "success");
      
      // Navigate after showing toast
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500); 
    } catch (error) {
      console.error("Registration Error:", error);
      showToastNotification("An error occurred during registration. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered-page-wrapper">
      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        type={toastType} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />
      
        <div className="login-container">
          {/* LEFT SIDE: Register Illustration */}
          <div className="left">
            <img
              src="https://via.placeholder.com/400x250/f7faff?text=Community+Illustration"
              alt="Community illustration"
              className="illustration"
              style={{marginBottom: '50px'}} 
            />
            <h3>Share stories, build community</h3>
            <div className="logo" style={{position: 'relative', top: 'auto', left: 'auto', marginTop: '20px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/3004/3004613.png" alt="Peer Reads Logo"/>
              <h1>Peer Reads</h1>
            </div>
          </div>
          
          {/* RIGHT SIDE: Register Form */}
          <div className="right">
            <div className="form-box">
              <h2>Join Peer Reads</h2>
              <form onSubmit={handleSubmit}>
                
                {/* Full Name */}
                <div className="input-group">
                    <input 
                      name="name" 
                      type="text" 
                      placeholder="Full Name" 
                      value={formData.name}
                      onChange={handleChange} 
                      disabled={loading}
                      className={errors.name ? 'input-error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                
                {/* Email */}
                <div className="input-group">
                    <input 
                      name="email" 
                      type="email" 
                      placeholder="Email" 
                      value={formData.email}
                      onChange={handleChange} 
                      disabled={loading}
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                
                {/* Confirm Email */}
                <div className="input-group">
                    <input 
                      name="confirmEmail" 
                      type="email" 
                      placeholder="Confirm Email" 
                      value={formData.confirmEmail}
                      onChange={handleChange} 
                      disabled={loading}
                      className={errors.confirmEmail ? 'input-error' : ''}
                    />
                    {errors.confirmEmail && <span className="error-message">{errors.confirmEmail}</span>}
                </div>
                
                {/* Password */}
                <div className="input-group">
                    <input 
                      name="password" 
                      type="password" 
                      placeholder="Password" 
                      value={formData.password}
                      onChange={handleChange} 
                      disabled={loading}
                      className={errors.password ? 'input-error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="input-group">
                    <input 
                      name="confirmPassword" 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={formData.confirmPassword}
                      onChange={handleChange} 
                      disabled={loading}
                      className={errors.confirmPassword ? 'input-error' : ''}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
                
                <button 
                  type="submit" 
                  style={{marginTop: '0'}}
                  disabled={loading}
                >
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
                <p className="link-text" style={{textAlign: 'center', fontSize: '12px'}}>
                  Already have a account? <Link to="/">Log In</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
}

export default Register;