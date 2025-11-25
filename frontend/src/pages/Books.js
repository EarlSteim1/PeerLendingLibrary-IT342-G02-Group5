import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import apiClient from "../api/client";
import "../css/global.css";
import "../css/Books.css";

function Books() {
  const navigate = useNavigate();
  const location = useLocation();
  const booksLentRef = useRef(null);
  const pendingRequestsRef = useRef(null);
  const [publicBooks, setPublicBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [userProfile, setUserProfile] = useState(StorageService.getUser());
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [pendingBooks, setPendingBooks] = useState([]);
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [bookToApprove, setBookToApprove] = useState(null);
  const [returnDate, setReturnDate] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [bookToRequest, setBookToRequest] = useState(null);
  const [requestReturnDate, setRequestReturnDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState(null);

  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const [profileData, publicData, myBooksData] = await Promise.all([
        apiClient.get("/users/me"),
        apiClient.get("/books"),
        apiClient.get("/books/mine"),
      ]);

      setUserProfile(profileData);
      StorageService.updateUser(profileData);
      setPublicBooks(publicData || []);
      setMyBooks(myBooksData || []);
      
      // Get pending books for admins
      if (profileData?.role === "ADMIN") {
        const pending = publicData.filter((book) => (book.status || "").toUpperCase() === "PENDING");
        setPendingBooks(pending);
      }
    } catch (error) {
      console.error("Failed to load books:", error);
      showToastNotification("Unable to load books. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }
    fetchBooks();
  }, [navigate]);

  // Scroll to specific section when navigating from dashboard
  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        if (location.state.scrollTo === 'booksLent') {
          setActiveSection('lent');
        } else if (location.state.scrollTo === 'pendingRequests') {
          setActiveSection('pending');
        }
      }, 100);
    }
    
    // Handle book navigation - open book modal if bookId is provided
    if (location.state?.bookId && !loading) {
      const book = publicBooks.find(b => b.id === location.state.bookId) || 
                   myBooks.find(b => b.id === location.state.bookId);
      if (book) {
        setTimeout(() => {
          setSelectedBook(book);
          setShowBookModal(true);
        }, 300);
      }
    }
  }, [location.state, loading, publicBooks, myBooks]);

  const handleBookClick = (book) => {
    if (!book) return;
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const closeBookModal = () => {
    setShowBookModal(false);
    setSelectedBook(null);
  };

  const openRequestModal = (bookId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent modal from opening when clicking request button
    }
    
    // Admins cannot request to borrow
    if (userProfile?.role === "ADMIN") {
      showToastNotification("Administrators cannot request to borrow books.", "error");
      return;
    }
    
    const book = availableBooks.find((b) => b.id === bookId);
    if (!book) return;
    
    setBookToRequest(book);
    // Set default return date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setRequestReturnDate(defaultDate.toISOString().split('T')[0]);
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setBookToRequest(null);
    setRequestReturnDate("");
  };

  const handleRequest = async () => {
    if (!bookToRequest || !requestReturnDate) {
      showToastNotification("Please select a return date", "error");
      return;
    }
    
    try {
      if (!userProfile) {
        throw new Error("Unable to request without a profile");
      }
      await apiClient.post(`/books/${bookToRequest.id}/request`, {
        borrowerName: userProfile.fullName || userProfile.username || userProfile.email,
        borrowerEmail: userProfile.email,
        returnDate: requestReturnDate
      });
      await fetchBooks();
      showToastNotification(
        `Request sent for "${bookToRequest?.title || "book"}". Owner will be notified.`,
        "success"
      );
      closeRequestModal();
      if (showBookModal) {
        closeBookModal();
      }
    } catch (error) {
      showToastNotification(
        error?.response?.data?.message || "Unable to send request. Please try again.",
        "error"
      );
    }
  };

  const openApproveModal = (bookId) => {
    const book = pendingBooks.find((b) => b.id === bookId);
    if (!book) return;
    setBookToApprove(book);
    // Set default return date to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setReturnDate(defaultDate.toISOString().split('T')[0]);
    setShowApproveModal(true);
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setBookToApprove(null);
    setReturnDate("");
  };

  const handleApprove = async () => {
    if (!bookToApprove || !returnDate) {
      showToastNotification("Please select a return date", "error");
      return;
    }

    try {
      setActionLoading({ id: bookToApprove.id, type: "approve" });
      await apiClient.post(`/books/${bookToApprove.id}/approve`, {
        returnDate: returnDate
      });
      await fetchBooks();
      showToastNotification(
        `Book request approved! ${bookToApprove?.borrowerName || "Borrower"} has been notified.`,
        "success"
      );
      closeApproveModal();
    } catch (error) {
      showToastNotification(
        error?.response?.data?.message || "An error occurred while approving the request",
        "error"
      );
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleDecline = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: "decline" });
      await apiClient.post(`/books/${bookId}/decline`);
      await fetchBooks();
      showToastNotification("Request declined successfully", "success");
    } catch (error) {
      showToastNotification("An error occurred while declining the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleLogout = () => {
    StorageService.clearSession();
    showToastNotification("Logged out successfully", "success");
    setTimeout(() => {
      navigate("/");
    }, 500);
  };

  // Filter all books (including borrowed) - exclude user's own books
  const allBooks = publicBooks.filter(
    (book) => {
      if (userProfile?.role === "ADMIN") return true;
      return !userProfile?.id || Number(book.ownerId) !== Number(userProfile.id);
    }
  );

  // Filter only available books - exclude user's own books
  const availableBooks = publicBooks.filter(
    (book) => {
      const status = (book.status || "").toUpperCase();
      // Only show books with AVAILABLE status
      if (status !== "AVAILABLE") return false;
      // Admins can see all available books
      if (userProfile?.role === "ADMIN") return true;
      // Regular users can't see their own books
      return !userProfile?.id || Number(book.ownerId) !== Number(userProfile.id);
    }
  );

  // Filter books by genre if selected
  const filterByGenre = (books) => {
    if (!selectedGenre) return books;
    return books.filter((book) => {
      const bookGenre = (book.genre || "").toUpperCase();
      return bookGenre === selectedGenre.toUpperCase();
    });
  };


  // Get books lent (books owned by user that are ON_LOAN)
  const booksLent = filterByGenre(myBooks)
    .filter((book) => {
      const status = (book.status || "").toUpperCase();
      return status === "ON_LOAN";
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  // Sort all books alphabetically
  const sortedAllBooks = filterByGenre([...allBooks]).sort((a, b) => 
    (a.title || "").localeCompare(b.title || "")
  );

  // Sort available books alphabetically
  const sortedAvailableBooks = filterByGenre([...availableBooks]).sort((a, b) => 
    (a.title || "").localeCompare(b.title || "")
  );

  const isAdmin = userProfile?.role === "ADMIN";

  // Generate star rating display
  const renderStars = (rating = 4.5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star full">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">★</span>);
    }
    return stars;
  };


  const handleSearch = (e) => {
    e.preventDefault();
    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) {
      setIsSearching(false);
      setFilteredBooks([]);
      setActiveSection("all");
      return;
    }
    
    // Filter books by title or author
    const results = publicBooks.filter((book) => {
      return (
        (book.title || '').toLowerCase().includes(query) ||
        (book.author || '').toLowerCase().includes(query)
      );
    });
    
    setFilteredBooks(results);
    setIsSearching(true);
    setActiveSection("search");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setFilteredBooks([]);
    setActiveSection("available");
  };

  if (loading) {
    return (
      <div className="books-page-wrapper">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="books-page-wrapper">
      <Toast 
        message={toastMessage} 
        type={toastType} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {/* Navigation Bar */}
      <nav className="books-navbar">
        <div className="logo-nav">
          <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" alt="Book logo"/>
          <h1>Peer Reads</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard">Books</Link>
          {userProfile?.role === "ADMIN" && (
            <Link to="/mybooks">Peer Reads</Link>
          )}
          <Link to="/books" className="active-link">Browse</Link>
          <Link to="/profile">Profile</Link>
          <button className="logout-button nav-action-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="books-content-wrapper">
        {/* Left Sidebar */}
        <aside className="books-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <button
              className={`sidebar-link ${activeSection === "all" && !isSearching ? "active" : ""}`}
              onClick={() => {
                setActiveSection("all");
                setIsSearching(false);
                setSearchQuery("");
                setFilteredBooks([]);
              }}
            >
              All Books
            </button>
            <button
              className={`sidebar-link ${activeSection === "available" && !isSearching ? "active" : ""}`}
              onClick={() => {
                setActiveSection("available");
                setIsSearching(false);
                setSearchQuery("");
                setFilteredBooks([]);
              }}
            >
              Available Books
            </button>
            {isAdmin && (
              <button
                className={`sidebar-link ${activeSection === "pending" && !isSearching ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("pending");
                  setIsSearching(false);
                  setSearchQuery("");
                  setFilteredBooks([]);
                }}
              >
                Pending Requests
              </button>
            )}
            {isAdmin && (
              <button
                className={`sidebar-link ${activeSection === "lent" && !isSearching ? "active" : ""}`}
                onClick={() => {
                  setActiveSection("lent");
                  setIsSearching(false);
                  setSearchQuery("");
                  setFilteredBooks([]);
                }}
              >
                Books Lent
              </button>
            )}
          </div>
          <div className="sidebar-section" style={{ marginTop: '24px' }}>
            <h3 className="sidebar-title">Genres</h3>
            <button
              className={`sidebar-link ${selectedGenre === null ? "active" : ""}`}
              onClick={() => setSelectedGenre(null)}
            >
              All Genres
            </button>
            <button
              className={`sidebar-link ${selectedGenre === "ANIME" ? "active" : ""}`}
              onClick={() => setSelectedGenre("ANIME")}
            >
              Anime
            </button>
            <button
              className={`sidebar-link ${selectedGenre === "ROMANCE" ? "active" : ""}`}
              onClick={() => setSelectedGenre("ROMANCE")}
            >
              Romance
            </button>
            <button
              className={`sidebar-link ${selectedGenre === "ACTION" ? "active" : ""}`}
              onClick={() => setSelectedGenre("ACTION")}
            >
              Action
            </button>
            <button
              className={`sidebar-link ${selectedGenre === "HORROR" ? "active" : ""}`}
              onClick={() => setSelectedGenre("HORROR")}
            >
              Horror
            </button>
            <button
              className={`sidebar-link ${selectedGenre === "FANTASY" ? "active" : ""}`}
              onClick={() => setSelectedGenre("FANTASY")}
            >
              Fantasy
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="books-main-content">
          {/* All Books Section */}
          {!isSearching && activeSection === "all" && (
            <section className="books-section">
              <h2 className="section-heading">All Books</h2>
              {sortedAllBooks.length > 0 ? (
                <div className="books-grid">
                  {sortedAllBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="book-card"
                      onClick={() => handleBookClick(book)}
                      style={{ cursor: 'pointer' }}
                    >
                    <div className="book-cover-container">
                      <img 
                        src={book.imageUrl || `https://picsum.photos/seed/${book.id}/200/300`}
                        alt={book.title}
                        className="book-cover"
                        onError={(e) => {
                          e.target.src = `https://picsum.photos/seed/${book.id}/200/300`;
                        }}
                      />
                    </div>
                    <div className="book-info">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">{book.author || "Unknown Author"}</p>
                      <div className="book-rating">
                        {renderStars(4.5)}
                      </div>
                      {(book.status || "").toUpperCase() === "ON_LOAN" && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#e74c3c', 
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          Currently Borrowed
                        </div>
                      )}
                      {(book.status || "").toUpperCase() === "PENDING" && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#f39c12', 
                          fontWeight: '600',
                          marginBottom: '8px'
                        }}>
                          Pending Request
                        </div>
                      )}
                      <div className="book-actions">
                        {!isAdmin && (book.status || "").toUpperCase() === "AVAILABLE" && (
                          <button 
                            className="request-btn"
                            onClick={(e) => openRequestModal(book.id, e)}
                          >
                            Request to Borrow
                          </button>
                        )}
                        {!isAdmin && (book.status || "").toUpperCase() !== "AVAILABLE" && (
                          <button 
                            className="request-btn"
                            disabled
                            style={{ 
                              opacity: 0.6, 
                              cursor: 'not-allowed',
                              background: '#95a5a6'
                            }}
                          >
                            Not Available
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No books found.</p>
              )}
            </section>
          )}

          {/* Available Books Section */}
          {!isSearching && activeSection === "available" && (
            <section className="books-section">
              <h2 className="section-heading">Available Books</h2>
              {sortedAvailableBooks.length > 0 ? (
                <div className="books-grid">
                  {sortedAvailableBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="book-card"
                      onClick={() => handleBookClick(book)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="book-cover-container">
                        <img 
                          src={book.imageUrl || `https://picsum.photos/seed/${book.id}/200/300`}
                          alt={book.title}
                          className="book-cover"
                          onError={(e) => {
                            e.target.src = `https://picsum.photos/seed/${book.id}/200/300`;
                          }}
                        />
                      </div>
                      <div className="book-info">
                        <h3 className="book-title">{book.title}</h3>
                        <p className="book-author">{book.author || "Unknown Author"}</p>
                        <div className="book-rating">
                          {renderStars(4.5)}
                        </div>
                        <div className="book-actions">
                          {!isAdmin && (
                            <button 
                              className="request-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRequestModal(book.id, e);
                              }}
                            >
                              Request to Borrow
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No available books found.</p>
              )}
            </section>
          )}

          {/* Pending Requests Section for Admins */}
          {!isSearching && activeSection === "pending" && isAdmin && (
            <section className="books-section" ref={pendingRequestsRef}>
              <h2 className="section-heading">Pending Requests</h2>
              {pendingBooks.length > 0 ? (
                <div className="pending-requests-grid">
                  {pendingBooks.map((book) => {
                    const formatDate = (dateStr) => {
                      if (!dateStr) return "N/A";
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                    };
                    
                    return (
                      <div key={book.id} className="pending-book-card">
                        <div className="pending-book-cover">
                          <img 
                            src={book.imageUrl || `https://picsum.photos/seed/${book.id}/200/300`}
                            alt={book.title}
                            onError={(e) => {
                              e.target.src = `https://picsum.photos/seed/${book.id}/200/300`;
                            }}
                          />
                        </div>
                        <div className="pending-book-info">
                          <h3 className="pending-book-title">{book.title}</h3>
                          <p className="pending-book-author">{book.author || "Unknown Author"}</p>
                          <div className="pending-request-details">
                            <div className="pending-detail-item">
                              <span className="pending-detail-label">Requested by:</span>
                              <span className="pending-detail-value">{book.borrowerName || "Unknown"}</span>
                            </div>
                            <div className="pending-detail-item">
                              <span className="pending-detail-label">Date:</span>
                              <span className="pending-detail-value">{formatDate(book.dateRequested)}</span>
                            </div>
                            {book.borrowerEmail && (
                              <div className="pending-detail-item">
                                <span className="pending-detail-label">Email:</span>
                                <span className="pending-detail-value">{book.borrowerEmail}</span>
                              </div>
                            )}
                          </div>
                          <div className="pending-actions">
                            <button 
                              className="approve-btn"
                              onClick={() => openApproveModal(book.id)}
                              disabled={actionLoading.id === book.id && actionLoading.type === "approve"}
                            >
                              {actionLoading.id === book.id && actionLoading.type === "approve" ? (
                                <>Loading...</>
                              ) : (
                                "Approve"
                              )}
                            </button>
                            <button 
                              className="decline-btn"
                              onClick={() => handleDecline(book.id)}
                              disabled={actionLoading.id === book.id && actionLoading.type === "decline"}
                            >
                              {actionLoading.id === book.id && actionLoading.type === "decline" ? (
                                <>Loading...</>
                              ) : (
                                "Decline"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-results-container">
                  <p className="no-results">No pending requests at the moment.</p>
                </div>
              )}
            </section>
          )}

          {/* Books Lent Section - Admin Only */}
          {!isSearching && activeSection === "lent" && isAdmin && (
            <section className="books-section" ref={booksLentRef}>
              <h2 className="section-heading">Books Lent</h2>
              {booksLent.length > 0 ? (
                <div className="books-grid">
                  {booksLent.map((book) => {
                    const formatDate = (dateStr) => {
                      if (!dateStr) return "N/A";
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                    };
                    
                    return (
                      <div 
                        key={book.id} 
                        className="book-card"
                        onClick={() => handleBookClick(book)}
                      >
                        <div className="book-cover-container">
                          <img 
                            src={book.imageUrl || `https://picsum.photos/seed/${book.id}/200/300`}
                            alt={book.title}
                            className="book-cover"
                            onError={(e) => {
                              e.target.src = `https://picsum.photos/seed/${book.id}/200/300`;
                            }}
                          />
                        </div>
                        <div className="book-info">
                          <h3 className="book-title">{book.title}</h3>
                          <p className="book-author">{book.author || "Unknown Author"}</p>
                          <div className="book-status-info">
                            <p className="status-text">
                              <strong>Borrower:</strong> {book.borrowerName || "Unknown"}
                            </p>
                            <p className="status-text">
                              <strong>Borrowed:</strong> {formatDate(book.dateBorrowed)}
                            </p>
                            <p className="status-text">
                              <strong>Return by:</strong> {formatDate(book.dateReturn)}
                            </p>
                          </div>
                          <div className="book-actions">
                            <span className="status-badge on-loan">On Loan</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-results">No books currently on loan.</p>
              )}
            </section>
          )}

          {availableBooks.length === 0 && !isAdmin && (
            <div className="empty-state">
              <p>No books available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Book Detail Modal */}
      {showBookModal && selectedBook && (
        <div className="book-modal-overlay" onClick={closeBookModal}>
          <div className="book-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="book-modal-close" onClick={closeBookModal}>×</button>
            <div className="book-modal-body">
              <div className="book-modal-cover">
                <img 
                  src={selectedBook.imageUrl || `https://picsum.photos/seed/${selectedBook.id}/400/600`}
                  alt={selectedBook.title}
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${selectedBook.id}/400/600`;
                  }}
                />
              </div>
              <div className="book-modal-details">
                <h2 className="book-modal-title">{selectedBook.title}</h2>
                <p className="book-modal-author">by {selectedBook.author || "Unknown Author"}</p>
                <div className="book-modal-rating">
                  {renderStars(4.5)}
                  <span className="rating-text">4.5 out of 5</span>
                </div>
                <div className="book-modal-info">
                  <div className="info-item">
                    <span className="info-label">Owner:</span>
                    <span className="info-value">{selectedBook.ownerName || "Peer Reads Admin"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date Added:</span>
                    <span className="info-value">{selectedBook.dateAdded || "N/A"}</span>
                  </div>
                  {selectedBook.isbn && (
                    <div className="info-item">
                      <span className="info-label">ISBN:</span>
                      <span className="info-value">{selectedBook.isbn}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value status-available">Available</span>
                  </div>
                </div>
                <div className="book-modal-description">
                  <p>
                    This book is available for borrowing. Click the button below to send a request to the owner.
                  </p>
                </div>
                <div className="book-modal-actions">
                  {!isAdmin && (
                    <button 
                      className="book-modal-request-btn"
                      onClick={(e) => openRequestModal(selectedBook.id, e)}
                    >
                      Request to Borrow
                    </button>
                  )}
                  {isAdmin && (
                    <div className="admin-modal-info">
                      <p style={{ color: 'var(--text-medium)', fontStyle: 'italic' }}>
                        As an administrator, you can manage this book from the "Peer Reads" page.
                      </p>
                    </div>
                  )}
                  <button 
                    className="book-modal-close-btn"
                    onClick={closeBookModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal with Date Picker */}
      {showApproveModal && bookToApprove && (
        <div className="book-modal-overlay" onClick={closeApproveModal}>
          <div className="book-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="book-modal-close" onClick={closeApproveModal}>×</button>
            <div className="book-modal-body">
              <div className="book-modal-cover">
                <img 
                  src={bookToApprove.imageUrl || `https://picsum.photos/seed/${bookToApprove.id}/400/600`}
                  alt={bookToApprove.title}
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${bookToApprove.id}/400/600`;
                  }}
                />
              </div>
              <div className="book-modal-details">
                <h2 className="book-modal-title">Approve Book Request</h2>
                <p className="book-modal-author">Request for {bookToApprove.title}</p>
                <div className="book-modal-info">
                  <div className="info-item">
                    <span className="info-label">Book:</span>
                    <span className="info-value">{bookToApprove.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Borrower:</span>
                    <span className="info-value">{bookToApprove.borrowerName || "Unknown"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Requested:</span>
                    <span className="info-value">{bookToApprove.dateRequested || "N/A"}</span>
                  </div>
                </div>
                <div className="modal-form-group" style={{ marginTop: '20px' }}>
                  <label htmlFor="returnDate" style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: 'var(--text-dark)'
                  }}>
                    Return Date *
                  </label>
                  <input
                    type="date"
                    id="returnDate"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-medium)',
                      fontSize: '1rem',
                      transition: 'var(--transition)'
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '8px' }}>
                    Select when the borrower should return this book
                  </p>
                </div>
                <div className="book-modal-actions">
                  <button 
                    className="book-modal-close-btn"
                    onClick={closeApproveModal}
                    disabled={actionLoading.id === bookToApprove.id}
                  >
                    Cancel
                  </button>
                  <button 
                    className="book-modal-request-btn"
                    onClick={handleApprove}
                    disabled={actionLoading.id === bookToApprove.id || !returnDate}
                  >
                    {actionLoading.id === bookToApprove.id && actionLoading.type === "approve" ? (
                      "Approving..."
                    ) : (
                      "Approve Request"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request to Borrow Modal with Date Picker */}
      {showRequestModal && bookToRequest && (
        <div className="book-modal-overlay" onClick={closeRequestModal}>
          <div className="book-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="book-modal-close" onClick={closeRequestModal}>×</button>
            <div className="book-modal-body">
              <div className="book-modal-cover">
                <img 
                  src={bookToRequest.imageUrl || `https://picsum.photos/seed/${bookToRequest.id}/400/600`}
                  alt={bookToRequest.title}
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/seed/${bookToRequest.id}/400/600`;
                  }}
                />
              </div>
              <div className="book-modal-details">
                <h2 className="book-modal-title">Request to Borrow</h2>
                <p className="book-modal-author">{bookToRequest.title} by {bookToRequest.author || "Unknown Author"}</p>
                <div className="book-modal-info">
                  <div className="info-item">
                    <span className="info-label">Book:</span>
                    <span className="info-value">{bookToRequest.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author:</span>
                    <span className="info-value">{bookToRequest.author || "Unknown"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Owner:</span>
                    <span className="info-value">{bookToRequest.ownerName || "Unknown"}</span>
                  </div>
                </div>
                <div className="modal-form-group" style={{ marginTop: '16px' }}>
                  <label htmlFor="requestReturnDate" style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontWeight: '600',
                    color: 'var(--text-dark)',
                    fontSize: '0.9rem'
                  }}>
                    When will you return this book? *
                  </label>
                  <input
                    type="date"
                    id="requestReturnDate"
                    value={requestReturnDate}
                    onChange={(e) => setRequestReturnDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-medium)',
                      fontSize: '0.9rem',
                      marginTop: '6px',
                      transition: 'var(--transition)',
                      backgroundColor: '#fff'
                    }}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-medium)', marginTop: '6px', lineHeight: '1.4' }}>
                    Select when you plan to return this book. The owner will see this date when reviewing your request.
                  </p>
                </div>
                <div className="book-modal-actions">
                  <button 
                    className="book-modal-close-btn"
                    onClick={closeRequestModal}
                  >
                    Cancel
                  </button>
                  <button 
                    className="book-modal-request-btn"
                    onClick={handleRequest}
                    disabled={!requestReturnDate}
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Books;

