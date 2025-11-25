import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
import apiClient from "../api/client";
import "../css/global.css";
import "../css/Dashboard.css"; 
import "../css/MyBooks.css";

const randomBookCovers = [
  "https://covers.openlibrary.org/b/id/10523342-L.jpg",
  "https://covers.openlibrary.org/b/id/8231856-L.jpg",
  "https://covers.openlibrary.org/b/id/11153220-L.jpg",
  "https://covers.openlibrary.org/b/id/8231992-L.jpg",
  "https://covers.openlibrary.org/b/id/10456458-L.jpg",
  "https://covers.openlibrary.org/b/id/10523148-L.jpg",
  "https://covers.openlibrary.org/b/id/11153248-L.jpg",
  "https://covers.openlibrary.org/b/id/10050483-L.jpg",
];

const getRandomCover = () => {
  const idx = Math.floor(Math.random() * randomBookCovers.length);
  return randomBookCovers[idx];
};

const BookItem = ({
  id,
  title,
  borrower,
  dateRequested,
  dateAdded,
  status,
  owner,
  image,
  onApprove,
  onDecline,
  onEdit,
  isProcessing,
  processingType,
  declineLabel = "Delete",
}) => {
  const normalizedStatus = (status || "").toUpperCase();
  const statusClass =
    normalizedStatus === "ON_LOAN"
      ? "onloan"
      : normalizedStatus === "PENDING"
        ? "pending"
        : "available";
  const statusLabel =
    normalizedStatus === "ON_LOAN"
      ? "On Loan"
      : normalizedStatus === "PENDING"
        ? "Pending"
        : "Available";

  return (
  <tr className={`book-row ${normalizedStatus === 'PENDING' ? 'pending' : ''}`}>
    <td style={{ display: "flex", alignItems: "center" }}>
      <img
        src={image || "https://via.placeholder.com/50x70?text=No+Cover"}
        alt={title}
        style={{
          width: 50,
          height: 70,
          objectFit: "cover",
          marginRight: 10,
          borderRadius: 4,
          flexShrink: 0,
        }}
      />
      {title}
      {normalizedStatus === 'PENDING' && (
        <span className="pending-badge">Pending</span>
      )}
    </td>
    <td>{borrower || owner || '-'}</td>
    <td>{dateRequested || dateAdded || '-'}</td>
    <td className="actions-cell">
      {normalizedStatus === 'PENDING' && onApprove && onDecline ? (
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
                <span className="button-spinner" /> {declineLabel}ing...
              </>
            ) : (
              declineLabel
            )}
          </button>
        </>
      ) : (
        (onEdit || onDecline) ? (
          <>
            {onEdit && <button className="action-btn edit-btn" onClick={() => onEdit(id)}>Edit</button>}
            {onDecline && <button className="action-btn decline-btn" onClick={() => onDecline(id)} disabled={isProcessing}>{isProcessing && processingType === 'decline' ? 'Deleting...' : 'Delete'}</button>}
          </>
        ) : (
          <span className={`status-tag ${statusClass}`}>
            {statusLabel}
          </span>
        )
      )}
    </td>
  </tr>
)};

function MyBooks() {
  const [activeTab, setActiveTab] = useState("books");
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(StorageService.getUser());
  const [publicQuery, setPublicQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [actionLoading, setActionLoading] = useState({ id: null, type: null });
  const [lendingBooks, setLendingBooks] = useState([]);
  const [publicBooks, setPublicBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBookData, setEditBookData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [bookToApprove, setBookToApprove] = useState(null);
  const [returnDate, setReturnDate] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [bookToRequest, setBookToRequest] = useState(null);
  const [requestReturnDate, setRequestReturnDate] = useState("");

  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const [profileData, myBooksData, publicBooksData] = await Promise.all([
        apiClient.get("/users/me"),
        apiClient.get("/books/mine"),
        apiClient.get("/books"),
      ]);
      setUserProfile(profileData);
      StorageService.updateUser(profileData);
      setLendingBooks(myBooksData || []);
      setPublicBooks(publicBooksData || []);
    } catch (error) {
      console.error("Failed to load books:", error);
      showToastNotification(
        error.message || "Unable to load books. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }
    // Check if user is admin
    const currentUser = StorageService.getUser();
    if (currentUser?.role !== "ADMIN") {
      showToastNotification("Access denied. Only administrators can access this page.", "error");
      navigate("/dashboard");
      return;
    }
    fetchBooks();

    if (location?.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
    if (location?.state && location.state.query) {
      setPublicQuery(location.state.query);
    } else {
      setPublicQuery("");
    }
  }, [navigate, location]);

  const isOwner = (ownerId) => {
    if (!userProfile || ownerId === undefined || ownerId === null) return false;
    return Number(ownerId) === Number(userProfile.id);
  };

  const isAdmin = userProfile?.role === "ADMIN";

  const pendingRequests = lendingBooks.filter(
    (book) => book.status === "PENDING" && (isAdmin || isOwner(book.ownerId))
  );

  const lendingDisplay = lendingBooks.filter(
    (book) => isAdmin || isOwner(book.ownerId)
  );

  const borrowingBooks = (publicBooks || []).filter((book) => {
    if (!book.borrowerEmail || !userProfile?.email) return false;
    return book.borrowerEmail.toLowerCase() === userProfile.email.toLowerCase();
  });

  const availablePublicBooks = publicBooks.filter(
    (book) => {
      const status = (book.status || "").toUpperCase();
      // Show all AVAILABLE books, including admin's own books (so admins can see books they added)
      // For regular users, exclude their own books from the available list
      if (status !== "AVAILABLE") return false;
      if (isAdmin) return true; // Admins see all available books including their own
      return !userProfile?.id || Number(book.ownerId) !== Number(userProfile.id);
    }
  );

  const visiblePublicBooks =
    publicQuery && activeTab === "books"
      ? availablePublicBooks.filter((book) => {
          const q = publicQuery.trim().toLowerCase();
          return (
            (book.title || "").toLowerCase().includes(q) ||
            (book.author || "").toLowerCase().includes(q) ||
            (book.isbn || "").toLowerCase().includes(q) ||
            (book.ownerName || "").toLowerCase().includes(q)
          );
        })
      : availablePublicBooks;

  const openRequestModal = (bookId) => {
    const book = publicBooks.find((b) => b.id === bookId);
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
      setActionLoading({ id: bookToRequest.id, type: "request" });
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
      setActiveTab("requests");
      closeRequestModal();
    } catch (error) {
      showToastNotification(
        error?.response?.data?.message || "Unable to send request. Please try again.",
        "error"
      );
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const sortByTitle = (list = []) => {
    return [...list].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" })
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStatusPill = (status) => {
    const normalized = (status || "").toUpperCase();
    const label =
      normalized === "ON_LOAN"
        ? "On Loan"
        : normalized === "PENDING"
        ? "Pending"
        : "Available";
    return <span className={`status-pill ${normalized.toLowerCase()}`}>{label}</span>;
  };

  const sortedPendingRequests = sortByTitle(pendingRequests);
  const sortedVisiblePublicBooks = sortByTitle(visiblePublicBooks);
  const sortedBorrowingBooks = sortByTitle(borrowingBooks);
  const sortedLendingDisplay = sortByTitle(lendingDisplay);

  const openEditModal = (bookId) => {
    const book = lendingBooks.find((b) => b.id === bookId);
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
      showToastNotification("Please provide title and author", "error");
      return;
    }
    setIsEditing(true);
    try {
      await apiClient.put(`/books/${editBookData.id}`, {
        title: editBookData.title.trim(),
        author: editBookData.author.trim(),
        isbn: editBookData.isbn ? editBookData.isbn.trim() : "",
        imageUrl: editBookData.imageUrl,
        genre: editBookData.genre || undefined,
      });
      await fetchBooks();
      showToastNotification("Book updated successfully", "success");
      closeEditModal();
    } catch (err) {
      showToastNotification("Unable to save changes", "error");
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    StorageService.clearSession();
    showToastNotification("Logged out successfully", "success");
    setTimeout(() => navigate("/"), 500);
  };

  const openApproveModal = (bookId) => {
    const book = lendingBooks.find((b) => b.id === bookId);
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
      setActiveTab("lending");
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
      const book = lendingBooks.find((b) => b.id === bookId);
      if (!book) return;
      await apiClient.post(`/books/${bookId}/decline`);
      await fetchBooks();
      showToastNotification(`Book request from ${book?.borrowerName || "Borrower"} has been declined.`, "success");
    } catch {
      showToastNotification("An error occurred while declining the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const openDeleteConfirm = (bookId) => {
    const book =
      lendingBooks.find((b) => b.id === bookId) ||
      publicBooks.find((b) => b.id === bookId);
    if (!book) return;
    
    // Check if book is currently lent or borrowed
    const status = (book.status || "").toUpperCase();
    if (status === "ON_LOAN") {
      showToastNotification(
        `Warning: "${book.title}" is currently on loan to ${book.borrowerName || "a borrower"}. The book must be returned before it can be deleted.`,
        "error"
      );
      return;
    }
    
    if (status === "PENDING") {
      showToastNotification(
        `Warning: "${book.title}" has pending requests. Please approve or decline the request first before deleting.`,
        "error"
      );
      return;
    }
    
    setBookToDelete(book);
  };

  const closeDeleteConfirm = () => {
    setBookToDelete(null);
    setDeleteLoading(false);
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    
    // Double-check status before deletion
    const status = (bookToDelete.status || "").toUpperCase();
    if (status === "ON_LOAN" || status === "PENDING") {
      showToastNotification(
        `Cannot delete "${bookToDelete.title}". The book is currently ${status === "ON_LOAN" ? "on loan" : "pending"}.`,
        "error"
      );
      closeDeleteConfirm();
      return;
    }
    
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/books/${bookToDelete.id}`);
      await fetchBooks();
      showToastNotification(`"${bookToDelete.title}" has been removed.`, "success");
      closeDeleteConfirm();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Unable to delete book. Please try again.";
      showToastNotification(errorMessage, "error");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />

      <nav className="navbar">
        <div className="logo-nav">
          <img src="https://cdn-icons-png.flaticon.com/512/29/29302.png" alt="Book logo"/>
          <h1>Peer Reads</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/books">Browse</Link>
          <Link to="/mybooks" className="active-link">
            Peer Reads
          </Link>
          <Link to="/profile">Profile</Link>
          <button className="logout-button nav-action-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </nav>

      {loading && (
        <div className="loading-banner">
          Loading your library...
        </div>
      )}

      <div className="mybooks-content">
        <section className="requests-section">
          <h3 className="section-title">My Lending Requests</h3>
          {sortedPendingRequests.length > 0 ? (
            <table className="books-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Requester</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPendingRequests.map((book) => (
                  <BookItem
                    key={book.id}
                    id={book.id}
                    title={book.title}
                    borrower={book.borrowerName}
                    dateRequested={book.dateRequested}
                    dateAdded={book.dateAdded}
                    status={book.status}
                    owner={book.ownerName}
                    image={book.imageUrl || getRandomCover()}
                    onApprove={openApproveModal}
                    onDecline={handleDecline}
                    onEdit={isAdmin || isOwner(book.ownerId) ? openEditModal : null}
                    isProcessing={actionLoading.id === book.id}
                    processingType={actionLoading.type}
                    declineLabel="Cancel"
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-msg">No incoming requests at this time.</p>
          )}
        </section>

        <section className="available-books-section">
          <h3 className="section-title">Available Books</h3>
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
              {sortedVisiblePublicBooks.length > 0 ? (
                sortedVisiblePublicBooks.map((book) => {
                  const canEdit = isAdmin || isOwner(book.ownerId);
                  const status = (book.status || "").toUpperCase();
                  return (
                    <tr
                      key={`public-${book.id}`}
                      className={`book-row ${status === "PENDING" ? "pending" : ""}`}
                    >
                      <td style={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={book.imageUrl || "https://via.placeholder.com/50x70?text=No+Cover"}
                          alt={book.title}
                          style={{
                            width: 50,
                            height: 70,
                            objectFit: "cover",
                            marginRight: 10,
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        />
                        {book.title}{" "}
                        {status === "PENDING" && <span className="pending-badge">Pending</span>}
                      </td>
                      <td>{book.ownerName || "-"}</td>
                      <td>{book.dateAdded || "-"}</td>
                      <td className="actions-cell">
                        {canEdit ? (
                          <button
                            className="action-btn decline-btn"
                            onClick={() => openDeleteConfirm(book.id)}
                          >
                            Delete
                          </button>
                        ) : status === "PENDING" ? (
                          <button className="action-btn" disabled>
                            Pending
                          </button>
                        ) : (
                          <button
                            className="action-btn request-btn"
                            onClick={() => openRequestModal(book.id)}
                            disabled={actionLoading.id === book.id}
                          >
                            {actionLoading.id === book.id && actionLoading.type === "request"
                              ? "Sending request..."
                              : "Request to Borrow"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "18px" }}>
                    No public books available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="lending-section">
          <h3 className="section-title">My Lending</h3>
          {sortedLendingDisplay.length > 0 ? (
            <table className="books-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Borrowed On</th>
                  <th>Return By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLendingDisplay.map((book) => {
                  const status = (book.status || "").toUpperCase();
                  const isPending = status === "PENDING";
                  return (
                    <tr key={`lending-${book.id}`}>
                      <td style={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={book.imageUrl || getRandomCover()}
                          alt={book.title}
                          style={{
                            width: 50,
                            height: 70,
                            objectFit: "cover",
                            marginRight: 10,
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{book.title}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-medium)" }}>
                            {book.author || "Unknown Author"}
                          </div>
                        </div>
                      </td>
                      <td>{book.borrowerName || "—"}</td>
                      <td>{formatDate(book.dateBorrowed || book.dateAdded)}</td>
                      <td>{formatDate(book.dateReturn)}</td>
                      <td>{renderStatusPill(book.status)}</td>
                      <td className="actions-cell">
                        {isPending ? (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => openApproveModal(book.id)}
                              disabled={actionLoading.id === book.id && actionLoading.type === "approve"}
                            >
                              {actionLoading.id === book.id && actionLoading.type === "approve"
                                ? "Approving..."
                                : "Approve"}
                            </button>
                            <button
                              className="action-btn decline-btn"
                              onClick={() => handleDecline(book.id)}
                              disabled={actionLoading.id === book.id && actionLoading.type === "decline"}
                            >
                              {actionLoading.id === book.id && actionLoading.type === "decline"
                                ? "Declining..."
                                : "Cancel"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => openEditModal(book.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn decline-btn"
                              onClick={() => openDeleteConfirm(book.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="empty-msg">You have not added any books for lending yet.</p>
          )}
        </section>
      </div>

      {/* Updated Delete Confirmation Modal - dashboard style */}
      {bookToDelete && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Delete Book</h4>
              <button className="close-button" onClick={closeDeleteConfirm}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>"{bookToDelete.title}"</strong>?</p>
              {(() => {
                const status = (bookToDelete.status || "").toUpperCase();
                const isOnLoan = status === "ON_LOAN";
                const isPending = status === "PENDING";
                const hasBorrower = bookToDelete.borrowerName;
                
                if (isOnLoan || isPending) {
                  return (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      border: '2px solid #ffc107',
                      borderRadius: '8px',
                      color: '#856404'
                    }}>
                      <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
                        ⚠️ Warning: This book cannot be deleted!
                      </p>
                      {isOnLoan && (
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          This book is currently <strong>on loan</strong> to <strong>{hasBorrower || "a borrower"}</strong>. 
                          The book must be returned first before it can be deleted.
                        </p>
                      )}
                      {isPending && (
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          This book has <strong>pending requests</strong>. Please approve or decline the request first before deleting.
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeDeleteConfirm}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteBook}
                disabled={deleteLoading || (bookToDelete.status || "").toUpperCase() === "ON_LOAN" || (bookToDelete.status || "").toUpperCase() === "PENDING"}
                style={{
                  opacity: ((bookToDelete.status || "").toUpperCase() === "ON_LOAN" || (bookToDelete.status || "").toUpperCase() === "PENDING") ? 0.5 : 1,
                  cursor: ((bookToDelete.status || "").toUpperCase() === "ON_LOAN" || (bookToDelete.status || "").toUpperCase() === "PENDING") ? 'not-allowed' : 'pointer'
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && editBookData && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Edit Book Details</h4>
              <button className="close-button" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-body">
              <div className="modal-form-group">
                <label htmlFor="edit-title">Title *</label>
                <input
                  type="text"
                  id="edit-title"
                  value={editBookData.title}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, title: e.target.value })
                  }
                  required
                  autoFocus
                  placeholder="Enter book title"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '1rem',
                    marginTop: '8px',
                    transition: 'var(--transition)'
                  }}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="edit-author">Author *</label>
                <input
                  type="text"
                  id="edit-author"
                  value={editBookData.author || ""}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, author: e.target.value })
                  }
                  required
                  placeholder="Enter author name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '1rem',
                    marginTop: '8px',
                    transition: 'var(--transition)'
                  }}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="edit-isbn">ISBN (Optional)</label>
                <input
                  type="text"
                  id="edit-isbn"
                  value={editBookData.isbn || ""}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, isbn: e.target.value })
                  }
                  placeholder="Enter ISBN"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '1rem',
                    marginTop: '8px',
                    transition: 'var(--transition)'
                  }}
                />
              </div>
              {editBookData.genre !== undefined && (
                <div className="modal-form-group">
                  <label htmlFor="edit-genre">Genre (Optional)</label>
                  <select
                    id="edit-genre"
                    value={editBookData.genre || ""}
                    onChange={(e) =>
                      setEditBookData({ ...editBookData, genre: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-medium)',
                      fontSize: '1rem',
                      marginTop: '8px',
                      backgroundColor: '#fff',
                      transition: 'var(--transition)'
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
              )}
              <div className="modal-actions" style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px',
                padding: '16px 20px',
                borderTop: '1px solid var(--border-color)',
                marginTop: '20px'
              }}>
                <button 
                  type="button" 
                  onClick={closeEditModal} 
                  disabled={isEditing}
                  className="btn btn-secondary"
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: 'var(--button-blue)',
                    border: '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: isEditing ? 'not-allowed' : 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isEditing}
                  className="btn action-btn"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: isEditing ? 'not-allowed' : 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal with Date Picker */}
      {showApproveModal && bookToApprove && (
        <div className="modal-overlay" onClick={closeApproveModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Approve Book Request</h4>
              <button className="close-button" onClick={closeApproveModal}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Approve request for <strong>{bookToApprove.title}</strong> by <strong>{bookToApprove.borrowerName || "Unknown"}</strong>?
              </p>
              <div className="modal-form-group">
                <label htmlFor="returnDate">Return Date *</label>
                <input
                  type="date"
                  id="returnDate"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '1rem',
                    marginTop: '8px'
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '6px' }}>
                  Select when the borrower should return this book
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button 
                className="btn btn-secondary" 
                onClick={closeApproveModal}
                disabled={actionLoading.id === bookToApprove.id}
              >
                Cancel
              </button>
              <button 
                className="btn action-btn approve-btn"
                onClick={handleApprove}
                disabled={actionLoading.id === bookToApprove.id || !returnDate}
              >
                {actionLoading.id === bookToApprove.id && actionLoading.type === "approve" ? (
                  <>
                    <span className="button-spinner" /> Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request to Borrow Modal with Date Picker */}
      {showRequestModal && bookToRequest && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Request to Borrow</h4>
              <button className="close-button" onClick={closeRequestModal}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Request to borrow <strong>{bookToRequest.title}</strong> by <strong>{bookToRequest.author || "Unknown Author"}</strong>?
              </p>
              <div className="modal-form-group">
                <label htmlFor="requestReturnDate">When will you return this book? *</label>
                <input
                  type="date"
                  id="requestReturnDate"
                  value={requestReturnDate}
                  onChange={(e) => setRequestReturnDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-medium)',
                    fontSize: '1rem',
                    marginTop: '8px'
                  }}
                />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginTop: '6px' }}>
                  Select when you plan to return this book. The owner will see this date when reviewing your request.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button 
                className="btn btn-secondary" 
                onClick={closeRequestModal}
                disabled={actionLoading.id === bookToRequest.id}
              >
                Cancel
              </button>
              <button 
                className="btn action-btn request-btn"
                onClick={handleRequest}
                disabled={actionLoading.id === bookToRequest.id || !requestReturnDate}
              >
                {actionLoading.id === bookToRequest.id && actionLoading.type === "request" ? (
                  <>
                    <span className="button-spinner" /> Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBooks;
