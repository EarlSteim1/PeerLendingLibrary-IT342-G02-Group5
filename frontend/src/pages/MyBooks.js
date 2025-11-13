import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import "../css/global.css";
import "../css/Dashboard.css"; // Includes Navbar styles
import "../css/MyBooks.css"; 

// ... BookItem component (unchanged) ...
const BookItem = ({ title, borrower, dateRequested, status }) => (
  <tr className="book-row">
    <td>{title}</td>
    <td>{borrower}</td>
    <td>{dateRequested}</td>
    <td className="actions-cell">
      {status === 'pending' ? (
        <>
          <button className="action-btn approve-btn">Approve</button>
          <button className="action-btn decline-btn">Decline</button>
        </>
      ) : (
        <span className={`status-tag ${status}`}>{status === 'onloan' ? 'On Loan' : 'Available'}</span>
      )}
    </td>
  </tr>
);


function MyBooks() {
  const [activeTab, setActiveTab] = useState("lending");
  const navigate = useNavigate(); // Initialize useNavigate

  // Dummy data structure (unchanged)
  const lendingBooks = [
    { id: 1, title: "Dune", borrower: "Paul A.", dateRequested: "2025-11-01", status: "pending" },
    { id: 2, title: "Dune", borrower: "Frodo A.", dateRequested: "2025-11-05", status: "pending" },
    { id: 3, title: "The Lord of Rings", borrower: "Frodo B.", dateRequested: "2025-11-10", status: "pending" },
  ];

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
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mybooks" className="active-link">My Books</Link>
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

      {/* --- My Books Content (unchanged) --- */}
      <div className="mybooks-content">
        <div className="books-container">
          
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'borrowing' ? 'active' : ''}`}
              onClick={() => setActiveTab('borrowing')}
            >
              Books I'm Borrowing
            </button>
            <button 
              className={`tab-btn ${activeTab === 'lending' ? 'active' : ''}`}
              onClick={() => setActiveTab('lending')}
            >
              Books I'm Lending
            </button>
            <button 
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Incoming Requests
            </button>
          </div>
          
          <div className="tab-panel">
            {/* Table View */}
            <table className="books-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'lending' && lendingBooks.map(book => (
                  <BookItem key={book.id} {...book} status="pending" />
                ))}
                {activeTab === 'borrowing' && (
                  <BookItem title="The Name of the Wind" borrower="You" dateRequested="2025-10-15" status="onloan" />
                )}
                {activeTab === 'requests' && lendingBooks.map(book => (
                  <BookItem key={book.id} {...book} status="pending" />
                ))}
                
                {lendingBooks.length === 0 && activeTab === 'lending' && (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>No books available for lending.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyBooks;