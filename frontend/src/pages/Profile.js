import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import "../css/global.css";
import "../css/Dashboard.css";
import "../css/Profile.css";

// Helper component to display either the value or an input field
const DetailRow = ({ label, name, value, isEditing, onChange, type = "text" }) => (
  <div className="detail-item">
    <span className="detail-label">{label}:</span>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="detail-input"
        required
      />
    ) : (
      <span className="detail-value">{value}</span>
    )}
  </div>
);

function Profile() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "Alex O'Connell",
    email: "alex.oconnell@example.com",
    location: "Cebu City, Philippines",
    bio: "Avid reader and fantasy fan!",
    joinedDate: "October 2024",
  });

  const handleLogout = () => {
    console.log("User logged out.");
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Simulate API call to save data
    console.log("Profile saved:", profileData);
    setIsEditing(false); // Switch back to View Mode
  };

  const handleEdit = () => {
    // This function sets the state to enable editing mode
    setIsEditing(true); 
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* --- Top Navigation Bar --- */}
      <nav className="navbar">
        <div className="logo-nav">
            <img src="https://cdn-icons-png.flaticon.com/512/3004/3004613.png" alt="Logo"/>
            <h1>Peer Reads</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mybooks">My Books</Link>
          <Link to="/profile" className="active-link">Profile</Link>
          <button className="logout-button nav-action-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      {/* --- Main Profile Content --- */}
      <div className="profile-content">
        <div className="profile-header">
          <img 
            src="https://via.placeholder.com/120/ADD8E6/000000?text=👤"
            alt="User Profile" 
            className="user-profile-picture" 
          />
          <div className="header-info">
            <h2>Hello, {profileData.fullName}</h2>
            <p className="joined-date">Joined {profileData.joinedDate}</p>
          </div>
        </div>

        <div className="profile-details-card">
          <h3>Profile Details</h3>
          
          <form onSubmit={handleSave}>
            {/* Profile Detail Rows */}
            <DetailRow 
              label="Full Name" 
              name="fullName" 
              value={profileData.fullName} 
              isEditing={isEditing} 
              onChange={handleChange}
            />
            <DetailRow 
              label="Email" 
              name="email" 
              value={profileData.email} 
              isEditing={isEditing} 
              onChange={handleChange}
              type="email"
            />
            <DetailRow 
              label="Location" 
              name="location" 
              value={profileData.location} 
              isEditing={isEditing} 
              onChange={handleChange}
            />
            <DetailRow 
              label="Bio" 
              name="bio" 
              value={profileData.bio} 
              isEditing={isEditing} 
              onChange={handleChange}
            />
            
            {/* Toggling the button based on the mode */}
            {isEditing ? (
              <button type="submit" className="edit-profile-btn save-btn">Save Profile</button>
            ) : (
              <button type="button" className="edit-profile-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;