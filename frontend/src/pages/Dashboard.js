import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import "../css/global.css"; 
import "../css/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "" });
  const [books, setBooks] = useState([]);
  const [statistics, setStatistics] = useState({
    booksLent: 0,
    booksBorrowed: 0,
    pendingRequests: 0,
  });
  const [userProfile, setUserProfile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Load data on mount
  useEffect(() => {
    // Check if user is logged in
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }

    // Load user profile
    const profile = StorageService.getUserProfile();
    if (profile) {
      setUserProfile(profile);
    }

    // Load books and statistics
    loadBooksAndStats();
  }, [navigate]);

  const loadBooksAndStats = () => {
    const lendingBooks = StorageService.getLendingBooks();
    setBooks(lendingBooks);
    
    const stats = StorageService.getStatistics();
    setStatistics(stats);
  };

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to My Books and show Books tab with the search query
      navigate('/mybooks', { state: { tab: 'books', query: searchQuery.trim() } });
    } else {
      showToastNotification("Please enter a search term", "error");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (newBook.title && newBook.author) {
      setIsAddingBook(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const bookToAdd = {
          title: newBook.title.trim(),
          author: newBook.author.trim(),
          isbn: newBook.isbn.trim() || "N/A",
          status: "available",
          borrower: null,
          owner: userProfile?.fullName || userProfile?.username || 'You',
        };

        // Save to storage
        StorageService.addLendingBook(bookToAdd);
        
        // Reload books and stats
        loadBooksAndStats();
        
        setNewBook({ title: "", author: "", isbn: "" });
        setShowAddBookModal(false);

        showToastNotification(`Book "${bookToAdd.title}" has been added successfully!`, "success");

        setTimeout(() => {
          // After adding a book, navigate to My Books and open the 'Books' tab (admin view)
          navigate("/mybooks", { state: { tab: 'books' } });
        }, 1200);
      } catch (error) {
        showToastNotification("An error occurred while adding the book", "error");
      } finally {
        setIsAddingBook(false);
      }
    } else {
      showToastNotification("Please fill in at least the title and author", "error");
    }
  };

  const openAddBookModal = () => {
    setShowAddBookModal(true);
  };

  const closeAddBookModal = () => {
    setShowAddBookModal(false);
    setNewBook({ title: "", author: "", isbn: "" });
  };

  return (
    <div className="dashboard-wrapper">
      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        type={toastType} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />
      
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
        <h2 className="welcome-header">
          Hello, {userProfile?.fullName || "User"}! Welcome back.
        </h2>

        <div className="stats-grid">
          {/* Card 1: Books Lent */}
          <div className="stat-card lent-card">
            <h3>Books Lent</h3>
            <p className="stat-number">{statistics.booksLent}</p>
            <span className="card-icon">🗂️</span>
          </div>

          {/* Card 2: Books Borrowed */}
          <div className="stat-card borrowed-card">
            <h3>Books Borrowed</h3>
            <p className="stat-number">{statistics.booksBorrowed}</p>
            <span className="card-icon">📖</span>
          </div>

          {/* Card 3: Pending Requests */}
          <div className="stat-card pending-card">
            <h3>Pending Requests</h3>
            <p className="stat-number">{statistics.pendingRequests}</p>
            <span className="card-icon">🔔</span>
          </div>
        </div>
        
        <div className="bottom-section">
          
          {/* Left Column: Find Books */}
          <div className="find-books-panel">
            <h3>Find Books</h3>
            <form className="search-group" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Search by title, author, or ISBN" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
            </form>
          </div>
          

          {/* Right Column: Recent Activity & My Books */}
          <div className="activity-panel">
            
            <div className="recent-activity-box">
              <h3>Recent Activity</h3>
              {statistics.pendingRequests > 0 ? (
                <>
                  <p>You have {statistics.pendingRequests} new request{statistics.pendingRequests > 1 ? 's' : ''}.</p>
                  <p className="activity-detail">Check your incoming requests to approve or decline.</p>
                </>
              ) : (
                <p>No recent activity.</p>
              )}
              {statistics.booksLent > 0 && (
                <p className="activity-detail" style={{marginTop: '10px'}}>
                  You have {statistics.booksLent} book{statistics.booksLent > 1 ? 's' : ''} currently on loan.
                </p>
              )}
            </div>

            <div className="my-books-box">
              <h3>Your Books</h3>
              {books.slice(0, 5).map(book => (
                <p key={book.id} style={{cursor: 'pointer'}} onClick={() => navigate('/mybooks')}>
                  {book.title} ({book.status === 'onloan' ? 'On Loan' : book.status === 'pending' ? 'Pending' : 'Available'}) 
                  <span style={{float: 'right'}}>›</span>
                </p>
              ))}
              {books.length === 0 && (
                <p style={{color: 'var(--text-medium)', fontStyle: 'italic'}}>No books added yet.</p>
              )}
              {books.length > 5 && (
                <p style={{color: 'var(--button-blue)', cursor: 'pointer', textAlign: 'center', marginTop: '10px'}} onClick={() => navigate('/mybooks')}>
                  View all {books.length} books →
                </p>
              )}
              <button className="add-book-btn" onClick={openAddBookModal}>+ Add a New Book</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="modal-overlay" onClick={closeAddBookModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add a New Book</h2>
              <button className="close-modal-btn" onClick={closeAddBookModal}>×</button>
            </div>
            <form onSubmit={handleAddBook}>
              <div className="modal-form-group">
                <label>Book Title *</label>
                <input
                  type="text"
                  placeholder="Enter book title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label>Author *</label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label>ISBN (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter ISBN"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={closeAddBookModal}
                  disabled={isAddingBook}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isAddingBook}
                >
                  {isAddingBook ? (
                    <>
                      <span className="spinner"></span>
                      Adding...
                    </>
                  ) : (
                    "Add Book"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;