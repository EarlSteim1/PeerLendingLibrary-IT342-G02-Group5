import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import apiClient from "../api/client";
import "../css/global.css"; 
import "../css/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", isbn: "", imageUrl: "", genre: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [publicBooks, setPublicBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [statistics, setStatistics] = useState({
    booksLent: 0,
    booksBorrowed: 0,
    pendingRequests: 0,
  });
  const [userProfile, setUserProfile] = useState(StorageService.getUser());
  const [pageLoading, setPageLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleBorrowedBookClick = () => {
    showToastNotification("This book is already borrowed and not available right now.", "error");
  };

  const fetchDashboardData = async () => {
    try {
      setPageLoading(true);
      const [profileData, statsData, publicData, myBooksData] = await Promise.all([
        apiClient.get("/users/me"),
        apiClient.get("/dashboard/stats"),
        apiClient.get("/books"),
        apiClient.get("/books/mine"),
      ]);

      setUserProfile(profileData);
      StorageService.updateUser(profileData);
      setStatistics(statsData || { booksLent: 0, booksBorrowed: 0, pendingRequests: 0, availableBooks: 0 });
      setPublicBooks(publicData || []);
      setMyBooks(myBooksData || []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      showToastNotification(error.message || "Unable to load dashboard data", "error");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }
    fetchDashboardData();
  }, [navigate]);

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
    const results = (publicBooks || []).filter(b => {
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

  const compressImage = (file, maxWidth = 300, maxHeight = 300, quality = 0.5) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Try multiple quality levels to ensure it fits
          const tryCompress = (currentQuality) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                const compressedReader = new FileReader();
                compressedReader.onloadend = () => {
                  const result = compressedReader.result;
                  // Limit to ~100KB base64 (which is ~75KB actual image)
                  // This should fit in most database columns
                  if (result.length > 100000 && currentQuality > 0.2) {
                    // Try again with lower quality
                    tryCompress(currentQuality - 0.1);
                  } else {
                    resolve(result);
                  }
                };
                compressedReader.readAsDataURL(blob);
              },
              'image/jpeg',
              currentQuality
            );
          };
          
          tryCompress(quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToastNotification('Please select an image file', 'error');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToastNotification('Image size must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      try {
        // Compress and resize image before converting to base64
        const compressedDataUrl = await compressImage(file);
        setImagePreview(compressedDataUrl);
        setNewBook({ ...newBook, imageUrl: compressedDataUrl });
      } catch (error) {
        console.error('Error processing image:', error);
        showToastNotification('Error processing image. Please try another image.', 'error');
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setNewBook({ ...newBook, imageUrl: "" });
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    // Only admins may add books
    if (userProfile?.role !== 'ADMIN') {
      showToastNotification('Only administrators may add books.', 'error');
      return;
    }
    if (newBook.title && newBook.author) {
      setIsAddingBook(true);
      
      try {
        // Prepare request data
        const requestData = {
          title: newBook.title.trim(),
          author: newBook.author.trim(),
          isbn: newBook.isbn.trim() || undefined,
          genre: newBook.genre || undefined,
        };

        // Only include imageUrl if it exists and is not too large
        // Limit base64 to ~100KB to ensure it fits in database
        if (newBook.imageUrl) {
          if (newBook.imageUrl.length > 100000) {
            showToastNotification('Image is too large. Please use a smaller image file.', 'error');
            setIsAddingBook(false);
            return;
          }
          requestData.imageUrl = newBook.imageUrl;
        }

        // Save to storage
        const bookTitle = newBook.title.trim();
        const response = await apiClient.post("/books", requestData);
        
        // Clear form first
        setNewBook({ title: "", author: "", isbn: "", imageUrl: "", genre: "" });
        setImagePreview(null);
        setImageFile(null);
        setShowAddBookModal(false);
        
        // Refresh dashboard data to show the new book immediately
        // Force a fresh fetch to ensure the new book appears in both sections
        await fetchDashboardData();
        
        showToastNotification(`Book "${bookTitle}" has been added successfully!`, "success");
      } catch (error) {
        console.error('Error adding book:', error);
        const errorMessage = error?.response?.data?.message || error?.message || "An error occurred while adding the book";
        showToastNotification(errorMessage, "error");
      } finally {
        setIsAddingBook(false);
      }
    } else {
      showToastNotification("Please fill in at least the title and author", "error");
    }
  };

  const openAddBookModal = () => {
    if (userProfile?.role !== 'ADMIN') {
      showToastNotification('Only administrators may add books.', 'error');
      return;
    }
    setShowAddBookModal(true);
  };

  const closeAddBookModal = () => {
    setShowAddBookModal(false);
    setNewBook({ title: "", author: "", isbn: "", imageUrl: "", genre: "" });
    setImagePreview(null);
    setImageFile(null);
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
          <Link to="/dashboard" className="active-link">Dashboard</Link>
          <Link to="/books">Browse</Link>
          {userProfile?.role === "ADMIN" && (
            <Link to="/mybooks">Peer Reads</Link>
          )}
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

      {pageLoading && (
        <div className="loading-banner">
          Syncing with the server...
        </div>
      )}

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
                            setSearchQuery('');
                            navigate('/books', { state: { bookId: b.id } });
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
              <div 
                className="stat-card lent-card"
                onClick={() => navigate('/books', { state: { scrollTo: 'booksLent' } })}
                style={{ cursor: 'pointer' }}
              >
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
              <div 
                className="stat-card pending-card"
                onClick={() => navigate('/books', { state: { scrollTo: 'pendingRequests' } })}
                style={{ cursor: 'pointer' }}
              >
                <h3>Pending Requests</h3>
                <p className="stat-number">{statistics.pendingRequests}</p>
                <span className="card-icon">🔔</span>
              </div>
            </div>

            <h2 className="welcome-header">Hello, {userProfile?.fullName || "User"}! Welcome back.</h2>

            {/* Currently Borrowed Books Section */}
            {(() => {
              const borrowedBooks = publicBooks.filter(book => 
                book.borrowerEmail && 
                userProfile?.email && 
                book.borrowerEmail.toLowerCase() === userProfile.email.toLowerCase() &&
                (book.status || "").toUpperCase() === "ON_LOAN"
              );
              
              if (borrowedBooks.length > 0) {
                return (
                  <div className="borrowed-books-section">
                    <h3 className="section-subtitle">Currently Reading</h3>
                    <div className="borrowed-books-grid">
                      {borrowedBooks.map(book => {
                        const formatDate = (dateStr) => {
                          if (!dateStr) return "N/A";
                          const date = new Date(dateStr);
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
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
                        
                        const daysRemaining = getDaysRemaining(book.dateReturn);
                        const isOverdue = daysRemaining !== null && daysRemaining < 0;
                        
                        return (
                          <div 
                            key={book.id} 
                            className="borrowed-book-card"
                            onClick={() => navigate('/profile', { state: { scrollTo: 'booksLent' } })}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="borrowed-book-cover">
                              <img 
                                src={book.imageUrl || `https://picsum.photos/seed/${book.id}/200/300`}
                                alt={book.title}
                                onError={(e) => {
                                  e.target.src = `https://picsum.photos/seed/${book.id}/200/300`;
                                }}
                              />
                            </div>
                            <div className="borrowed-book-details">
                              <h4 className="borrowed-book-title">{book.title}</h4>
                              <p className="borrowed-book-author">{book.author || "Unknown Author"}</p>
                              <div className="borrowed-dates">
                                <div className="date-item">
                                  <span className="date-label">Borrowed:</span>
                                  <span className="date-value">{formatDate(book.dateBorrowed)}</span>
                                </div>
                                <div className="date-item">
                                  <span className="date-label">Return by:</span>
                                  <span className={`date-value ${isOverdue ? 'overdue' : ''}`}>
                                    {formatDate(book.dateReturn)}
                                    {daysRemaining !== null && (
                                      <span className={`days-badge ${isOverdue ? 'overdue-badge' : daysRemaining <= 7 ? 'warning-badge' : ''}`}>
                                        {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Recommended Books Section */}
            {(() => {
              // Get borrowed books to check if a book is currently borrowed by the user
              const borrowedBooks = publicBooks.filter(book => 
                book.borrowerEmail && 
                userProfile?.email && 
                book.borrowerEmail.toLowerCase() === userProfile.email.toLowerCase() &&
                (book.status || "").toUpperCase() === "ON_LOAN"
              );
              
              const borrowedBookIds = new Set(borrowedBooks.map(book => book.id));
              
              // Filter recommended books: show all books for admin, exclude user's own books for regular users
              const recommendedBooks = publicBooks.filter(book => {
                if (userProfile?.role === "ADMIN") return true;
                // Regular users can't see their own books
                return !userProfile?.id || Number(book.ownerId) !== Number(userProfile.id);
              }).sort((a, b) => {
                // Sort by date added (newest first), then alphabetically by title
                if (a.dateAdded && b.dateAdded) {
                  // Handle date strings in format "YYYY-MM-DD"
                  const dateA = new Date(a.dateAdded + 'T00:00:00');
                  const dateB = new Date(b.dateAdded + 'T00:00:00');
                  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    const diff = dateB.getTime() - dateA.getTime();
                    if (diff !== 0) return diff;
                  }
                } else if (a.dateAdded && !b.dateAdded) {
                  return -1; // a has date, b doesn't - a comes first
                } else if (!a.dateAdded && b.dateAdded) {
                  return 1; // b has date, a doesn't - b comes first
                }
                // If both have no date or dates are equal, sort alphabetically
                return (a.title || "").localeCompare(b.title || "");
              }).slice(0, 6);
              
              return (
                <div className="mybooks-panel">
                  <h3 style={{marginBottom:12}}>Recommended Books</h3>
                  {recommendedBooks.length > 0 ? (
                    recommendedBooks.map(book => {
                      // Check if this book is currently borrowed by the user
                      const isBorrowed = borrowedBookIds.has(book.id);
                      
                      return (
                        <div 
                          className="book-row" 
                          key={book.id} 
                          onClick={() => {
                            if (isBorrowed) {
                              // If book is borrowed, go to Profile page
                              navigate('/profile', { state: { scrollTo: 'borrowedBooks' } });
                            } else {
                              // If book is available, go to book detail page
                              navigate('/books', { state: { bookId: book.id } });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <img 
                              src={book.imageUrl || `https://picsum.photos/seed/${book.id}/64/64`} 
                              alt={book.title || 'Book cover'} 
                              style={{width:48,height:48,borderRadius:8,objectFit:'cover'}}
                              onError={(e) => {
                                e.target.src = `https://picsum.photos/seed/${book.id}/64/64`;
                              }}
                            />
                            <div>
                              <div style={{fontWeight:700}}>{book.title}</div>
                              <div style={{fontSize:12,color:'#777'}}>{book.author || 'Unknown'}</div>
                            </div>
                          </div>
                          <div style={{fontSize:12,color:'#999'}}>›</div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{color:'#999',fontSize:14,padding:'12px 0'}}>No books available</p>
                  )}
                </div>
              );
            })()}

            {/* (Activity panels moved to right column) */}

            {/* Popular Books Section - Horizontal Cards */}
            {(() => {
              // Use the same sorted data as Recommended Books (newest first)
              const sortedPublicBooks = [...publicBooks].sort((a, b) => {
                // Sort by date added (newest first), then alphabetically by title
                if (a.dateAdded && b.dateAdded) {
                  // Handle date strings in format "YYYY-MM-DD"
                  const dateA = new Date(a.dateAdded + 'T00:00:00');
                  const dateB = new Date(b.dateAdded + 'T00:00:00');
                  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                    const diff = dateB.getTime() - dateA.getTime();
                    if (diff !== 0) return diff;
                  }
                } else if (a.dateAdded && !b.dateAdded) {
                  return -1; // a has date, b doesn't - a comes first
                } else if (!a.dateAdded && b.dateAdded) {
                  return 1; // b has date, a doesn't - b comes first
                }
                // If both have no date or dates are equal, sort alphabetically
                return (a.title || "").localeCompare(b.title || "");
              });

              return (
                <div className="popular-row">
                  {sortedPublicBooks.slice(0,4).map((b, i) => (
                    <div 
                      key={b.id || i} 
                      className="popular-card"
                      onClick={() => navigate('/books', { state: { bookId: b.id } })}
                      style={{ cursor: 'pointer' }}
                    >
                      <img 
                        src={b.imageUrl || `https://picsum.photos/seed/${b.id || i}/300/200`} 
                        alt={b.title || 'Book cover'} 
                        onError={(e) => {
                          e.target.src = `https://picsum.photos/seed/${b.id || i}/300/200`;
                        }}
                      />
                      <div style={{fontWeight:600}}>{b.title || 'Sample Book'}</div>
                      <div style={{fontSize:12, color:'#666'}}>{b.author || 'Unknown'}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

          </main>

          <aside className="right-column">
            {/* Your Books now on top */}
            <div className="my-books-box">
              <h3>Your Books</h3>
              {(() => {
                // Get books that are lent (ON_LOAN) or borrowed (user is borrower)
                const lentBooks = myBooks.filter(book => {
                  const status = (book.status || "").toUpperCase();
                  return status === "ON_LOAN";
                });
                
                const borrowedBooks = publicBooks.filter(book => {
                  const status = (book.status || "").toUpperCase();
                  if (status !== "ON_LOAN") return false;
                  if (!book.borrowerEmail || !userProfile?.email) return false;
                  return book.borrowerEmail.toLowerCase() === userProfile.email.toLowerCase();
                });
                
                const allLentBorrowed = [...lentBooks, ...borrowedBooks].slice(0, 5);
                
                if (allLentBorrowed.length > 0) {
                  return (
                    <>
                      {allLentBorrowed.map(book => {
                        const isBorrowed = borrowedBooks.some(b => b.id === book.id);
                        const status = (book.status || "").toUpperCase();
                        const statusText = isBorrowed ? 'Borrowed' : (status === 'ON_LOAN' ? 'Lent' : status === 'PENDING' ? 'Pending' : 'Available');
                        return (
                          <p 
                            key={book.id} 
                            style={{cursor: 'pointer'}} 
                            onClick={() => {
                              if (isBorrowed) {
                                navigate('/profile', { state: { scrollTo: 'borrowedBooks' } });
                              } else {
                                navigate('/mybooks');
                              }
                            }}
                          >
                            {book.title} ({statusText})
                            <span style={{float: 'right'}}>›</span>
                          </p>
                        );
                      })}
                      {(lentBooks.length + borrowedBooks.length) > 5 && (
                        <p style={{color: 'var(--button-blue)', cursor: 'pointer', textAlign: 'center', marginTop: '10px'}} onClick={() => navigate('/mybooks')}>
                          View all {lentBooks.length + borrowedBooks.length} books →
                        </p>
                      )}
                    </>
                  );
                }
                
                // Show regular books if no lent/borrowed books
                return (
                  <>
                    {myBooks.slice(0, 5).map(book => (
                      <p key={book.id} style={{cursor: 'pointer'}} onClick={() => navigate('/mybooks')}>
                        {book.title} ({book.status === 'onloan' ? 'On Loan' : book.status === 'pending' ? 'Pending' : 'Available'}) 
                        <span style={{float: 'right'}}>›</span>
                      </p>
                    ))}
                    {myBooks.length === 0 && (
                      <p style={{color: 'var(--text-medium)', fontStyle: 'italic'}}>No books added yet.</p>
                    )}
                    {myBooks.length > 5 && (
                      <p style={{color: 'var(--button-blue)', cursor: 'pointer', textAlign: 'center', marginTop: '10px'}} onClick={() => navigate('/mybooks')}>
                        View all {myBooks.length} books →
                      </p>
                    )}
                  </>
                );
              })()}
              {userProfile?.role === 'ADMIN' && (
                <button 
                  className="add-book-btn bigger-add-btn"
                  onClick={openAddBookModal}
                >
                  + Add a New Book
                </button>
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
              <div className="modal-form-group">
                <label>Genre (Optional)</label>
                <select
                  value={newBook.genre}
                  onChange={(e) => setNewBook({...newBook, genre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">Select a genre</option>
                  <option value="ANIME">Anime</option>
                  <option value="ROMANCE">Romance</option>
                  <option value="ACTION">Action</option>
                  <option value="HORROR">Horror</option>
                  <option value="FANTASY">Fantasy</option>
                </select>
              </div>
              <div className="modal-form-group">
                <label>Book Cover Image (Optional)</label>
                {imagePreview ? (
                  <div style={{ marginBottom: '10px', position: 'relative' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '10px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ddd',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Upload a book cover image (max 5MB)
                    </p>
                  </div>
                )}
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
