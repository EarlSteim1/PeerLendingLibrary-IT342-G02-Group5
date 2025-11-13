import React from "react";
import { Link, useNavigate } from "react-router-dom"; 
import "../css/global.css"; 
import "../css/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Authentication logic here (clear session, tokens)
    console.log("User logged out.");
    navigate("/"); // Redirects to the Login page
  };

  return (
    <div className="dashboard-wrapper">
      
      {/* --- Top Navigation Bar --- */}
      <nav className="navbar">
        {/* LEFT SIDE: Logo */}
        <div className="logo-nav">
          <img src="https://cdn-icons-png.flaticon.com/512/3004/3004613.png" alt="Logo"/>
          <h1>Peer Reads</h1>
        </div>
        
        {/* RIGHT SIDE: Navigation Links and Log Out Button */}
        <div className="nav-links">
          <Link to="/dashboard" className="active-link">Dashboard</Link>
          <Link to="/mybooks">My Books</Link>
          <Link to="/profile">Profile</Link>
          
          {/* Log Out button */}
          <button 
            className="logout-button nav-action-btn"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* ... Main Dashboard Content ... */}
      <div className="dashboard-content">
        <h2 className="welcome-header">Hello, [User Name] Welcome back.</h2>

        <div className="stats-grid">
          {/* Card 1: Books Lent */}
          <div className="stat-card lent-card">
            <h3>Books Lent</h3>
            <p className="stat-number">5</p>
            <span className="card-icon">🗂️</span>
          </div>

          {/* Card 2: Books Borrowed */}
          <div className="stat-card borrowed-card">
            <h3>Books Borrowed</h3>
            <p className="stat-number">3</p>
            <span className="card-icon">📖</span>
          </div>

          {/* Card 3: Pending Requests */}
          <div className="stat-card pending-card">
            <h3>Pending Requests</h3>
            <p className="stat-number">3</p>
            <span className="card-icon">🔔</span>
          </div>
        </div>
        
        <div className="bottom-section">
          
          {/* Left Column: Find Books */}
          <div className="find-books-panel">
            <h3>Find Books</h3>
            <div className="search-group">
              <input type="text" placeholder="Search" />
              <button>Search</button>
            </div>
          </div>
          

          {/* Right Column: Recent Activity & My Books */}
          <div className="activity-panel">
            
            <div className="recent-activity-box">
              <h3>Recent Activity</h3>
              <p>You have 1 new request from Sarah K.</p>
              <p className="activity-detail">Lord the Rings is due in days.</p>
            </div>

            <div className="my-books-box">
              <h3>Your Books</h3>
              <p>Lord of her Rings (On Loan) <span style={{float: 'right'}}>›</span></p>
              <p>Project Hail Mary (Available) <span style={{float: 'right'}}>›</span></p>
              <button className="add-book-btn">+ Add a New Book</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;