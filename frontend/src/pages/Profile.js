import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import apiClient from "../api/client";
import "../css/global.css";
import "../css/Dashboard.css";
import "../css/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const booksLentRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(StorageService.getUser());
  const [originalData, setOriginalData] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    location: "",
    bio: "",
    joinedDate: "",
    profilePictureUrl: "https://via.placeholder.com/120/ADD8E6/000000?text=👤",
    gender: "",
    language: "",
    nickName: "",
    country: "",
  });
  const [publicBooks, setPublicBooks] = useState([]);
  const [booksLent, setBooksLent] = useState([]);
  const [returningBookId, setReturningBookId] = useState(null);

  useEffect(() => {
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }

    const loadProfile = async () => {
      try {
        const [data, booksData] = await Promise.all([
          apiClient.get("/users/me"),
          apiClient.get("/books"),
        ]);
        
        StorageService.updateUser(data);
        setUserProfile(data);
        
        // Load additional fields from localStorage
        const storedProfile = localStorage.getItem('userProfileExtended');
        const extendedData = storedProfile ? JSON.parse(storedProfile) : {};
        
        setProfileData({
          fullName: data.fullName || "",
          email: data.email || "",
          location: data.location || "",
          bio: data.bio || "",
          joinedDate: data.joinedDate
            ? new Date(data.joinedDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : "",
          profilePictureUrl:
            data.profilePictureUrl ||
            "https://via.placeholder.com/120/ADD8E6/000000?text=👤",
          gender: extendedData.gender || "",
          language: extendedData.language || "",
          nickName: extendedData.nickName || "",
          country: extendedData.country || "",
        });

        // Filter books based on user role:
        // - Admin: books lent (books owned by user that are currently on loan)
        // - Regular user: books borrowed (books where user is the borrower)
        setPublicBooks(booksData || []);
        const isAdmin = data?.role === "ADMIN";
        const filteredBooks = (booksData || []).filter(book => {
          const status = (book.status || "").toUpperCase();
          if (status !== "ON_LOAN") return false;
          
          if (isAdmin) {
            // Admin: show books they lent (books they own)
            if (!book.ownerId || !data?.id) return false;
            return Number(book.ownerId) === Number(data.id);
          } else {
            // Regular user: show books they borrowed
            if (!book.borrowerEmail || !data?.email) return false;
            return book.borrowerEmail.toLowerCase() === data.email.toLowerCase();
          }
        });
        setBooksLent(filteredBooks);
      } catch (error) {
        console.error("Failed to load profile:", error);
        showToastNotification(
          error.message || "Unable to load profile details.",
          "error"
        );
      }
    };

    loadProfile();
  }, [navigate]);

  // Scroll to books lent section when navigating from dashboard
  useEffect(() => {
    if (location.state?.scrollTo === 'booksLent' && booksLentRef.current) {
      setTimeout(() => {
        booksLentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.state]);

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
      if (profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) {
        showToastNotification("Please enter a valid email address", "error");
        setIsSaving(false);
        return;
      }

      // Save backend-supported fields
      await apiClient.put("/users/me", {
        fullName: profileData.fullName,
        email: profileData.email,
        location: profileData.location,
        bio: profileData.bio,
        profilePictureUrl: profileData.profilePictureUrl,
      });

      // Save extended fields to localStorage
      const extendedFields = {
        gender: profileData.gender,
        language: profileData.language,
        nickName: profileData.nickName,
        country: profileData.country,
      };
      localStorage.setItem('userProfileExtended', JSON.stringify(extendedFields));

      StorageService.updateUser({
        ...StorageService.getUser(),
        fullName: profileData.fullName,
        email: profileData.email,
        location: profileData.location,
        bio: profileData.bio,
        profilePictureUrl: profileData.profilePictureUrl,
      });

      setOriginalData(null);
      setIsEditing(false);
      showToastNotification("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showToastNotification(
        error.message || "An error occurred while saving. Please try again.",
        "error"
      );
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
      if (file.size > 5 * 1024 * 1024) {
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
          profilePictureUrl: reader.result
        }));
        showToastNotification("Profile picture updated!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getDaysRemaining = (returnDate) => {
    if (!returnDate) return null;
    const today = new Date();
    const returnDateObj = new Date(returnDate);
    const diffTime = returnDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleReturnBook = async (bookId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent card click navigation
    }
    
    if (!window.confirm("Are you sure you want to return this book?")) {
      return;
    }

    try {
      setReturningBookId(bookId);
      await apiClient.post(`/books/${bookId}/return-borrowed`);
      
      // Reload books to update the list
      const booksData = await apiClient.get("/books");
      const data = StorageService.getUser();
      
      // Re-filter books based on user role
      const isAdmin = data?.role === "ADMIN";
      const filteredBooks = (booksData || []).filter(book => {
        const status = (book.status || "").toUpperCase();
        if (status !== "ON_LOAN") return false;
        
        if (isAdmin) {
          if (!book.ownerId || !data?.id) return false;
          return Number(book.ownerId) === Number(data.id);
        } else {
          if (!book.borrowerEmail || !data?.email) return false;
          return book.borrowerEmail.toLowerCase() === data.email.toLowerCase();
        }
      });
      setBooksLent(filteredBooks);
      setPublicBooks(booksData || []);
      
      showToastNotification("Book returned successfully!", "success");
    } catch (error) {
      console.error("Error returning book:", error);
      showToastNotification(
        error?.response?.data?.message || "Failed to return book. Please try again.",
        "error"
      );
    } finally {
      setReturningBookId(null);
    }
  };

  return (
    <div className="profile-wrapper">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="logo-nav">
          <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" alt="Book logo"/>
          <h1>Peer Reads</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/books">Browse</Link>
          {userProfile?.role === "ADMIN" && (
            <Link to="/mybooks">Peer Reads</Link>
          )}
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

      {/* Main Content */}
      <div className="profile-main-container">
        {/* Main Content Area */}
        <div className="profile-content-area">
          {/* Profile Card */}
          <div className="profile-card">
            {/* Profile Summary */}
            <div className="profile-summary">
              <div className="profile-picture-large">
                <img 
                  src={profileData.profilePictureUrl}
                  alt="User Profile" 
                  className={isEditing ? "profile-picture-editable" : ""}
                  onClick={handleProfilePictureClick}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/120/ADD8E6/000000?text=👤";
                  }}
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
              <div className="profile-info">
                <h3 className="profile-name">{profileData.fullName || "User Name"}</h3>
                <p className="profile-email">{profileData.email || "user@example.com"}</p>
              </div>
              <button 
                className="edit-button"
                onClick={isEditing ? handleCancel : handleEdit}
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Profile Fields - Two Columns */}
            <form onSubmit={handleSave} className="profile-form">
              <div className="profile-fields-grid">
                <div className="field-column">
                  <div className="form-field">
                    <label>Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleChange}
                        placeholder="Your First Name"
                        className="form-input"
                      />
                    ) : (
                      <div className="form-value">{profileData.fullName || "Not provided"}</div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={profileData.gender || ""}
                        onChange={handleChange}
                        className="form-input form-select"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="form-value">{profileData.gender || "Not provided"}</div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>Language</label>
                    {isEditing ? (
                      <select
                        name="language"
                        value={profileData.language || ""}
                        onChange={handleChange}
                        className="form-input form-select"
                      >
                        <option value="">Select Language</option>
                        <option value="English">English</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                      </select>
                    ) : (
                      <div className="form-value">{profileData.language || "Not provided"}</div>
                    )}
                  </div>
                </div>
                <div className="field-column">
                  <div className="form-field">
                    <label>Nick Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="nickName"
                        value={profileData.nickName || ""}
                        onChange={handleChange}
                        placeholder="Your Nick Name"
                        className="form-input"
                      />
                    ) : (
                      <div className="form-value">{profileData.nickName || "Not provided"}</div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>Country</label>
                    {isEditing ? (
                      <select
                        name="country"
                        value={profileData.country || ""}
                        onChange={handleChange}
                        className="form-input form-select"
                      >
                        <option value="">Select Country</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Philippines">Philippines</option>
                      </select>
                    ) : (
                      <div className="form-value">{profileData.country || "Not provided"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Address Section */}
              <div className="email-section">
                <h4 className="email-section-title">My email Address</h4>
                <div className="email-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="email-icon">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <div className="email-info">
                    <span className="email-address">{profileData.email || "user@example.com"}</span>
                    <span className="email-date">1 month ago</span>
                  </div>
                </div>
                {isEditing && (
                  <button type="button" className="add-email-button">
                    + Add Email Address
                  </button>
                )}
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Books Lent/Borrowed Section */}
          <div className="borrowed-books-section" ref={booksLentRef}>
            <h3 className="section-title">
              {userProfile?.role === "ADMIN" ? "Books Lent" : "Books Borrowed"}
            </h3>
            {booksLent.length === 0 ? (
              <div className="empty-state">
                <p>
                  {userProfile?.role === "ADMIN" 
                    ? "You haven't lent any books yet." 
                    : "You haven't borrowed any books yet."}
                </p>
              </div>
            ) : (
              <div className="borrowed-books-grid">
                {booksLent.map((book) => {
                  const daysRemaining = getDaysRemaining(book.dateReturn);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  
                  return (
                    <div 
                      key={book.id} 
                      className="borrowed-book-item"
                      onClick={() => navigate('/books', { state: { bookId: book.id } })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="book-cover-small">
                        <img 
                          src={book.imageUrl || `https://picsum.photos/seed/${book.id}/150/200`}
                          alt={book.title}
                          onError={(e) => {
                            e.target.src = `https://picsum.photos/seed/${book.id}/150/200`;
                          }}
                        />
                      </div>
                      <div className="book-info-small">
                        <div>
                          <h4 className="book-title-small">{book.title}</h4>
                          <p className="book-author-small">{book.author || "Unknown Author"}</p>
                          <div className="book-dates-small">
                            {userProfile?.role === "ADMIN" ? (
                              <>
                                <div className="date-row">
                                  <span className="date-label-small">Lent to:</span>
                                  <span className="date-value-small">{book.borrowerEmail || "Unknown"}</span>
                                </div>
                                <div className="date-row">
                                  <span className="date-label-small">Borrowed:</span>
                                  <span className="date-value-small">{formatDate(book.dateBorrowed)}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="date-row">
                                  <span className="date-label-small">Lent by:</span>
                                  <span className="date-value-small">{book.ownerName || "Unknown"}</span>
                                </div>
                                <div className="date-row">
                                  <span className="date-label-small">Borrowed:</span>
                                  <span className="date-value-small">{formatDate(book.dateBorrowed)}</span>
                                </div>
                              </>
                            )}
                            <div className="date-row">
                              <span className="date-label-small">Return by:</span>
                              <span className={`date-value-small ${isOverdue ? 'overdue' : ''}`}>
                                {formatDate(book.dateReturn)}
                              </span>
                            </div>
                            {daysRemaining !== null && (
                              <div className={`days-badge-small ${isOverdue ? 'overdue-badge' : daysRemaining <= 7 ? 'warning-badge' : ''}`}>
                                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                              </div>
                            )}
                          </div>
                          {/* Return Book Button - Only for regular users (Books Borrowed) */}
                          {userProfile?.role !== "ADMIN" && (
                            <button
                              className="return-book-button-profile"
                              onClick={(e) => handleReturnBook(book.id, e)}
                              disabled={returningBookId === book.id}
                            >
                              {returningBookId === book.id ? "Returning..." : "Return Book"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
