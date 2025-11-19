import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import "../css/global.css";
import "../css/Dashboard.css"; // Includes Navbar styles
import "../css/MyBooks.css";

// ... BookItem component (unchanged) ...
const BookItem = ({
  id,
  title,
  borrower,
  dateRequested,
  dateAdded,
  status,
  onApprove,
  onDecline,
  onEdit,
  isProcessing,
  processingType
}) => (
  <tr className="book-row">
    <td>{title}</td>
    <td>{borrower || '-'}</td>
    <td>{dateRequested || dateAdded || '-'}</td>
    <td className="actions-cell">
      {status === 'pending' && onApprove && onDecline ? (
        <>
          <button
            className="action-btn approve-btn"
            onClick={() => onApprove(id)}
            disabled={isProcessing}
          >
            {isProcessing && processingType === 'approve' ? (
              <>
                <span className="button-spinner" /> Approving...
              </>
            ) : (
              'Approve'
            )}
          </button>
          <button
            className="action-btn decline-btn"
            onClick={() => onDecline(id)}
            disabled={isProcessing}
          >
            {isProcessing && processingType === 'decline' ? (
              <>
                <span className="button-spinner" /> Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </>
      ) : (
        // If owner controls are provided, show Edit/Delete buttons, otherwise show status tag
        (onEdit || onDecline) ? (
          <>
            {onEdit && <button className="action-btn edit-btn" onClick={() => onEdit(id)}>Edit</button>}
            {onDecline && <button className="action-btn decline-btn" onClick={() => onDecline(id)} disabled={isProcessing}>{isProcessing && processingType === 'decline' ? 'Deleting...' : 'Delete'}</button>}
          </>
        ) : (
          <span className={`status-tag ${status}`}>
            {status === 'onloan' ? 'On Loan' : status === 'pending' ? 'Pending' : 'Available'}
          </span>
        )
      )}
    </td>
  </tr>
);


function MyBooks() {
  const [activeTab, setActiveTab] = useState("books");
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(null);
  const [publicQuery, setPublicQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [lendingBooks, setLendingBooks] = useState([]);
  const [borrowingBooks, setBorrowingBooks] = useState([]);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }

    // Load books
    loadBooks();

    // Load profile
    const profile = StorageService.getUserProfile();
    if (profile) setUserProfile(profile);

    // If navigation passed a tab preference (e.g., after adding a book), set active tab
    if (location?.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
    // Read search query if provided by Dashboard search
    if (location?.state && location.state.query) {
      setPublicQuery(location.state.query);
    } else {
      setPublicQuery('');
    }
  }, [navigate, location]);

  const loadBooks = () => {
    const lending = StorageService.getLendingBooks();
    const borrowing = StorageService.getBorrowingBooks();
    setLendingBooks(lending);
    setBorrowingBooks(borrowing);
  };

  // Pending requests that are relevant to the current user (admin): only requests for books they own
  const pendingRequests = lendingBooks.filter(book => book.status === 'pending' && (userProfile && (book.owner === userProfile.fullName || book.owner === userProfile.username)));

  // Books I'm Lending: show only books owned by current user that are actually on loan
  const lendingDisplay = userProfile ? lendingBooks.filter(book => (book.owner === userProfile.fullName || book.owner === userProfile.username) && book.status === 'onloan') : [];

  // Public Books list: all available books (users can request these)
  const publicBooks = lendingBooks.filter(book => book.status === 'available');
  const visiblePublicBooks = publicQuery && activeTab === 'books'
    ? publicBooks.filter(book => {
        const q = publicQuery.trim().toLowerCase();
        return (book.title || '').toLowerCase().includes(q) || (book.author || '').toLowerCase().includes(q) || (book.isbn || '').toLowerCase().includes(q) || (book.owner || '').toLowerCase().includes(q);
      })
    : publicBooks;

  const handleRequest = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: 'request' });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));

      const book = lendingBooks.find(b => b.id === bookId);
      if (!book) return;

      const user = StorageService.getUserProfile();
      const requester = user?.fullName || user?.username || 'Requester';
      const today = new Date().toISOString().split('T')[0];

      // Update book as a pending request
      StorageService.updateLendingBook(bookId, { status: 'pending', borrower: requester, dateRequested: today });

      // Reload books
      loadBooks();

      showToastNotification(`Request sent for "${book.title}". Owner will be notified.`, "success");
      // Switch to Incoming Requests so owner can see it
      setActiveTab('requests');
    } catch (error) {
      showToastNotification("Unable to send request. Please try again.", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };
  // Edit modal state & handlers (professional admin edit)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBookData, setEditBookData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const openEditModal = (bookId) => {
    const book = lendingBooks.find(b => b.id === bookId);
    if (!book) return;
    setEditBookData({ ...book });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditBookData(null);
    setIsEditing(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editBookData) return;
    if (!editBookData.title || !editBookData.author) {
      showToastNotification('Please provide title and author', 'error');
      return;
    }
    setIsEditing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      StorageService.updateLendingBook(editBookData.id, {
        title: editBookData.title.trim(),
        author: editBookData.author.trim(),
        isbn: editBookData.isbn || editBookData.isbn === '' ? editBookData.isbn.trim() : editBookData.isbn,
      });
      loadBooks();
      showToastNotification('Book updated successfully', 'success');
      closeEditModal();
    } catch (err) {
      console.error('Save edit failed', err);
      showToastNotification('Unable to save changes', 'error');
      setIsEditing(false);
    }
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

  const handleApprove = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: 'approve' });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const book = lendingBooks.find(b => b.id === bookId);
      if (!book) return;

      // Update in storage
      StorageService.updateLendingBook(bookId, { status: "onloan" });
      
      // Reload books
      loadBooks();
      
      showToastNotification(`Book request approved! ${book?.borrower || 'Borrower'} has been notified.`, "success");
    } catch (error) {
      showToastNotification("An error occurred while approving the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleDecline = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: 'decline' });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const book = lendingBooks.find(b => b.id === bookId);
      if (!book) return;

      // Delete from storage
      StorageService.deleteLendingBook(bookId);
      
      // Reload books
      loadBooks();
      
      showToastNotification(`Book request from ${book?.borrower || 'Borrower'} has been declined.`, "success");
    } catch (error) {
      showToastNotification("An error occurred while declining the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

const openDeleteConfirm = (bookId) => {
    const book = lendingBooks.find(b => b.id === bookId);
    if (!book) return;
    setBookToDelete(book);
  };

  const closeDeleteConfirm = () => {
    setBookToDelete(null);
    setDeleteLoading(false);
  };

const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    setDeleteLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      StorageService.deleteLendingBook(bookToDelete.id);
      loadBooks();
      showToastNotification(`"${bookToDelete.title}" has been removed.`, "success");
      closeDeleteConfirm();
    } catch (error) {
      console.error("Error deleting book:", error);
      showToastNotification("Unable to delete book. Please try again.", "error");
      setDeleteLoading(false);
    }
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
          {/* Public Books section for users to request borrowing */}
          <div className="public-books-panel">
            <h3 className="panel-title">Books</h3>
            <table className="books-table public">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Owner</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePublicBooks.length > 0 ? (
                  visiblePublicBooks.map(book => (
                    <tr key={`public-${book.id}`} className="book-row">
                      <td>{book.title}</td>
                      <td>{book.owner || '-'}</td>
                      <td>{book.dateAdded || '-'}</td>
                      <td className="actions-cell">
                          {book.owner && userProfile && (book.owner === userProfile.fullName || book.owner === userProfile.username) ? (
                          // Owner controls: Edit / Delete
                          <>
                            <button className="action-btn edit-btn" onClick={() => openEditModal(book.id)}>Edit</button>
                            <button className="action-btn decline-btn" onClick={() => openDeleteConfirm(book.id)}>Delete</button>
                          </>
                        ) : (
                          <button
                            className="action-btn request-btn"
                            onClick={() => handleRequest(book.id)}
                            disabled={actionLoading.id === book.id}
                          >
                            {actionLoading.id === book.id && actionLoading.type === 'request' ? 'Requesting...' : 'Request'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '18px'}}>No public books available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              Books
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
                    <th>{activeTab === 'books' ? 'Owner' : activeTab === 'requests' ? 'Requester' : 'Borrower'}</th>
                    <th>{activeTab === 'requests' ? 'Date Requested' : 'Date Added'}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
              <tbody>
                  {activeTab === 'lending' && lendingDisplay.length > 0 && lendingDisplay.map(book => (
                  <BookItem 
                    key={book.id} 
                    {...book} 
                      onApprove={book.status === 'pending' ? handleApprove : null}
                      onDecline={book.status === 'pending' ? handleDecline : () => openDeleteConfirm(book.id)}
                    onEdit={userProfile && (book.owner === userProfile.fullName || book.owner === userProfile.username) ? openEditModal : null}
                    onDelete={userProfile && (book.owner === userProfile.fullName || book.owner === userProfile.username) ? () => openDeleteConfirm(book.id) : null}
                    isProcessing={actionLoading.id === book.id}
                    processingType={actionLoading.type}
                  />
                ))}
                
                {activeTab === 'requests' && pendingRequests.length > 0 && pendingRequests.map(book => (
                  <BookItem 
                    key={book.id} 
                    {...book} 
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    isProcessing={actionLoading.id === book.id}
                    processingType={actionLoading.type}
                  />
                ))}
                
                {activeTab === 'lending' && lendingDisplay.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>You have not added any books for lending yet.</td></tr>
                )}
                {activeTab === 'requests' && pendingRequests.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px'}}>No incoming requests at this time.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Book</h2>
              <button className="close-modal-btn" onClick={closeDeleteConfirm}>×</button>
            </div>
            <p>
              Are you sure you want to delete <strong>{bookToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={closeDeleteConfirm} disabled={deleteLoading}>
                Cancel
              </button>
              <button type="button" className="submit-btn danger-btn" onClick={handleDeleteBook} disabled={deleteLoading}>
                {deleteLoading ? (
                  <>
                    <span className="spinner" /> Deleting...
                  </>
                ) : (
                  "Delete Book"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal (Admin) */}
      {showEditModal && editBookData && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Book</h2>
              <button className="close-modal-btn" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-form-group">
                <label>Book Title *</label>
                <input
                  type="text"
                  placeholder="Enter book title"
                  value={editBookData.title}
                  onChange={(e) => setEditBookData({...editBookData, title: e.target.value})}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label>Author *</label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={editBookData.author || ''}
                  onChange={(e) => setEditBookData({...editBookData, author: e.target.value})}
                  required
                />
              </div>
              <div className="modal-form-group">
                <label>ISBN (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter ISBN"
                  value={editBookData.isbn || ''}
                  onChange={(e) => setEditBookData({...editBookData, isbn: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={closeEditModal}
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
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

export default MyBooks;