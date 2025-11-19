import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import "../css/global.css";
import "../css/Dashboard.css";
import "../css/Profile.css";

// Helper component to display either the value or an input field
const DetailRow = ({ label, name, value, isEditing, onChange, type = "text", icon }) => (
  <div className={`detail-item ${isEditing ? 'detail-item-editing' : ''}`}>
    <span className="detail-label">
      {icon && <span className="detail-icon">{icon}</span>}
      {label}:
    </span>
    {isEditing ? (
      <div className="detail-input-wrapper">
        {type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            className="detail-input detail-textarea"
            rows="3"
            required
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="detail-input"
            required
          />
        )}
      </div>
    ) : (
      <span className="detail-value">{value || <em className="empty-value">Not provided</em>}</span>
    )}
  </div>
);

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    location: "",
    bio: "",
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    profilePicture: "https://via.placeholder.com/120/ADD8E6/000000?text=👤",
  });

  useEffect(() => {
    // Check if user is logged in
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }

    // Load user profile
    const savedProfile = StorageService.getUserProfile();
    if (savedProfile) {
      setProfileData(savedProfile);
    } else {
      // Initialize default profile
      const session = StorageService.getUserSession();
      const defaultProfile = {
        fullName: session?.username ? session.username.charAt(0).toUpperCase() + session.username.slice(1) : "User",
        email: `${session?.username || 'user'}@example.com`,
        location: "Philippines",
        bio: "Welcome to Peer Reads!",
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        profilePicture: "https://via.placeholder.com/120/ADD8E6/000000?text=👤",
      };
      setProfileData(defaultProfile);
      StorageService.saveUserProfile(defaultProfile);
    }
  }, [navigate]);

  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleLogout = () => {
    StorageService.clearSession();
    showToastNotification("Logged out successfully", "success");
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleEdit = () => {
    // Save original data for cancel
    setOriginalData({ ...profileData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditing(false);
    setOriginalData(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate email format
      if (profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) {
        showToastNotification("Please enter a valid email address", "error");
        setIsSaving(false);
        return;
      }

      // Simulate API call to save data
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Save to storage
      StorageService.saveUserProfile(profileData);
      
      console.log("Profile saved:", profileData);
      setOriginalData(null);
      setIsEditing(false);
      showToastNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToastNotification("An error occurred while saving. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToastNotification("Image size must be less than 5MB", "error");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showToastNotification("Please select an image file", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prevData => ({
          ...prevData,
          profilePicture: reader.result
        }));
        showToastNotification("Profile picture updated!", "success");
      };
      reader.readAsDataURL(file);
    }
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

      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        type={toastType} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {/* --- Main Profile Content --- */}
      <div className="profile-content">
        <div className={`profile-header ${isEditing ? 'profile-header-editing' : ''}`}>
          <div className="profile-picture-wrapper">
            <img 
              src={profileData.profilePicture}
              alt="User Profile" 
              className={`user-profile-picture ${isEditing ? 'profile-picture-editable' : ''}`}
              onClick={handleProfilePictureClick}
            />
            {isEditing && (
              <div className="profile-picture-overlay" onClick={handleProfilePictureClick}>
                <span className="camera-icon">📷</span>
                <span className="edit-text">Change Photo</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          <div className="header-info">
            <h2>Hello, {profileData.fullName}</h2>
            <p className="joined-date">Joined {profileData.joinedDate}</p>
          </div>
        </div>

        <div className={`profile-details-card ${isEditing ? 'profile-card-editing' : ''}`}>
          <div className="card-header">
            <h3>Profile Details</h3>
            {isEditing && (
              <span className="editing-indicator">
                <span className="indicator-dot"></span>
                Editing
              </span>
            )}
          </div>
          
          <form onSubmit={handleSave}>
            {/* Profile Detail Rows */}
            <DetailRow 
              label="Full Name" 
              name="fullName" 
              value={profileData.fullName} 
              isEditing={isEditing} 
              onChange={handleChange}
              icon="👤"
            />
            <DetailRow 
              label="Email" 
              name="email" 
              value={profileData.email} 
              isEditing={isEditing} 
              onChange={handleChange}
              type="email"
              icon="✉"
            />
            <DetailRow 
              label="Location" 
              name="location" 
              value={profileData.location} 
              isEditing={isEditing} 
              onChange={handleChange}
              icon="📍"
            />
            <DetailRow 
              label="Bio" 
              name="bio" 
              value={profileData.bio} 
              isEditing={isEditing} 
              onChange={handleChange}
              type="textarea"
              icon="📝"
            />
            
            {/* Action Buttons */}
            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    className="edit-profile-btn cancel-btn" 
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="edit-profile-btn save-btn" 
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span>✓</span> Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="edit-profile-btn" 
                  onClick={handleEdit}
                >
                  <span>✏</span> Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;