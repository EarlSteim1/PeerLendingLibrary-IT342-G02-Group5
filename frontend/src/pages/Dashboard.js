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
      // default behaviour for other search usages: navigate to MyBooks
      navigate('/mybooks', { state: { tab: 'books', query: searchQuery.trim() } });
    } else {
      showToastNotification("Please enter a search term", "error");
    }
  };

  // Top-dashboard search: filter local books and show floating results
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const handleTopSearch = (e) => {
    e.preventDefault();
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) {
      showToastNotification("Please enter a search term", "error");
      return;
    }
    // filter by title, author, isbn
    const results = (books || []).filter(b => {
      return (b.title || '').toLowerCase().includes(q)
        || (b.author || '').toLowerCase().includes(q)
        || (b.isbn || '').toLowerCase().includes(q);
    });
    setSearchResults(results);
    setSearchActive(true);
  };

  const closeSearchResults = () => {
    setSearchActive(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    // Only admins may add books
    if (userProfile?.role !== 'admin') {
      showToastNotification('Only administrators may add books.', 'error');
      return;
    }
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
    if (userProfile?.role !== 'admin') {
      showToastNotification('Only administrators may add books.', 'error');
      return;
    }
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
          <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" alt="Book logo"/>
          <h1>Peer Reads</h1>
        </div>
        {/* navbar search removed to keep a single compact dashboard search */}
        
        {/* RIGHT SIDE: Navigation Links and Log Out Button */}
        <div className="nav-links">
          <Link to="/dashboard" className="active-link">Books</Link>
          <Link to="/mybooks">Peer Reads</Link>
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
        <div className="dashboard-grid">
          <aside className="sidebar">
            <div className="brand"></div>
            <div className="nav-item active"></div>
          </aside>

            <main className="main-panel">
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <form className="top-search" onSubmit={handleTopSearch}>
                  <input
                    type="text"
                    placeholder="Search books by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit">Search</button>
                </form>

                {searchActive && (
                  <div className="search-results" onMouseDown={(e) => e.preventDefault()}>
                    {searchResults.length > 0 ? (
                      searchResults.map((b) => (
                        <div
                          key={b.id}
                          className="search-result-item"
                          onClick={() => {
                            setSearchActive(false);
                            navigate('/mybooks', { state: { query: b.title } });
                          }}
                        >
                          <div style={{ fontWeight: '600' }}>{b.title}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{b.author}</div>
                        </div>
                      ))
                    ) : (
                      <div className="search-result-item">No results</div>
                    )}
                  </div>
                )}
              </div>

            {/* Stats cards moved to top */}
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

            <h2 className="welcome-header">Hello, {userProfile?.fullName || "User"}! Welcome back.</h2>

            {/* (Activity panels moved to right column) */}

            <div className="popular-row">
              {books.slice(0,3).map((b, i) => (
                <div key={i} className="popular-card">
                  <img src={`https://picsum.photos/seed/${b.id || i}/300/200`} alt="cover" />
                  <div style={{fontWeight:600}}>{b.title || 'Sample Book'}</div>
                  <div style={{fontSize:12, color:'#666'}}>{b.author || 'Unknown'}</div>
                </div>
              ))}
              <div className="popular-card" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontSize:20,fontWeight:700,color:'#6b6bff'}}>+{Math.max(0, (books.length-3))}</div>
              </div>
            </div>

            <div className="mybooks-panel">
              <h3 style={{marginBottom:12}}>My Books</h3>
              {books.slice(0,6).map(book => (
                <div className="book-row" key={book.id} onClick={() => navigate('/mybooks')}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <img src={`https://picsum.photos/seed/${book.id}/64/64`} alt="thumb" style={{width:48,height:48,borderRadius:8}} />
                    <div>
                      <div style={{fontWeight:700}}>{book.title}</div>
                      <div style={{fontSize:12,color:'#777'}}>{book.author || 'Unknown'}</div>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:'#999'}}>›</div>
                </div>
              ))}
            </div>
          </main>

          <aside className="right-column">
            {/* Your Books now on top */}
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
              {userProfile?.role === 'admin' ? (
                <button 
                  className="add-book-btn bigger-add-btn"
                  onClick={openAddBookModal}
                >
                  + Add a New Book
                </button>
              ) : (
                <p style={{color: 'var(--text-medium)', fontSize: '13px', marginTop: '12px'}}>
                  Only administrators can add new books. To borrow, use the <strong>Find Books</strong> panel.
                </p>
              )}
            </div>

            {/* Recent Activity below */}
            <div className="activity-panel" style={{marginTop: '30px'}}>
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
            </div>
          </aside>
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
