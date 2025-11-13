import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registering:", formData);
    navigate("/"); 
  };

  return (
    <div className="centered-page-wrapper">
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
                
                {/* Full Name (EMOJI REMOVED) */}
                <div className="input-group">
                    <input name="name" type="text" placeholder="Full Name" onChange={handleChange} required />
                </div>
                
                {/* Email (EMOJI REMOVED) */}
                <div className="input-group">
                    <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
                </div>
                
                {/* Confirm Email (EMOJI REMOVED) */}
                <div className="input-group">
                    <input name="confirmEmail" type="email" placeholder="Confirm Email" onChange={handleChange} required />
                </div>
                
                {/* Password (EMOJI REMOVED) */}
                <div className="input-group">
                    <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
                </div>

                {/* Confirm Password (EMOJI REMOVED) */}
                <div className="input-group">
                    <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
                </div>
                
                <button type="submit" style={{marginTop: '0'}}>Sign Up</button>
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