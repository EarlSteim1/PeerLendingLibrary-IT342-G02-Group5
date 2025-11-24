import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Toast from "../components/Toast";
import StorageService from "../utils/storage";
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
  declineLabel = "Delete"
}) => (
  <tr className={`book-row ${status === 'pending' ? 'pending' : ''}`}>
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
      {status === 'pending' && (
        <span className="pending-badge">Pending</span>
      )}
    </td>
    <td>{borrower || owner || '-'}</td>
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBookData, setEditBookData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!StorageService.isLoggedIn()) {
      navigate("/");
      return;
    }
    loadBooks();

    const profile = StorageService.getUserProfile();
    if (profile) setUserProfile(profile);

    if (location?.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
    if (location?.state && location.state.query) {
      setPublicQuery(location.state.query);
    } else {
      setPublicQuery("");
    }
  }, [navigate, location]);

  const loadBooks = () => {
    const lending = (StorageService.getLendingBooks() || []).map(book => ({
      ...book,
      image: getRandomCover(),
    }));

    const borrowing = (StorageService.getBorrowingBooks() || []).map(book => ({
      ...book,
      image: getRandomCover(),
    }));

    setLendingBooks(lending);
    setBorrowingBooks(borrowing);
  };

  const isOwner = (bookOwner) => {
    if (!userProfile || !bookOwner) return false;
    const bookOwnerNorm = bookOwner.trim().toLowerCase();
    const fullNameNorm = userProfile.fullName?.trim().toLowerCase() || "";
    const usernameNorm = userProfile.username?.trim().toLowerCase() || "";
    return bookOwnerNorm === fullNameNorm || bookOwnerNorm === usernameNorm;
  };

  const isAdmin = userProfile?.role === "admin";

  const pendingRequests = lendingBooks.filter(
    (book) => book.status === "pending" && (isAdmin || isOwner(book.owner))
  );

  const lendingDisplay = lendingBooks.filter(
    (book) =>
      (isAdmin || isOwner(book.owner)) && (book.status === "onloan" || book.status === "pending")
  );

  const publicBooks = lendingBooks.filter(
    (book) => book.status === "available" || book.status === "pending"
  );
  const visiblePublicBooks =
    publicQuery && activeTab === "books"
      ? publicBooks.filter((book) => {
          const q = publicQuery.trim().toLowerCase();
          return (
            (book.title || "").toLowerCase().includes(q) ||
            (book.author || "").toLowerCase().includes(q) ||
            (book.isbn || "").toLowerCase().includes(q) ||
            (book.owner || "").toLowerCase().includes(q)
          );
        })
      : publicBooks;

  const handleRequest = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: "request" });
      await new Promise((resolve) => setTimeout(resolve, 600));
      const book = lendingBooks.find((b) => b.id === bookId);
      if (!book) return;
      const user = StorageService.getUserProfile();
      const requester = user?.fullName || user?.username || "Requester";
      const today = new Date().toISOString().split("T")[0];
      StorageService.updateLendingBook(bookId, {
        status: "pending",
        borrower: requester,
        dateRequested: today,
      });
      loadBooks();
      showToastNotification(`Request sent for "${book.title}". Owner will be notified.`, "success");
      setActiveTab("requests");
    } catch {
      showToastNotification("Unable to send request. Please try again.", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

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
      await new Promise((resolve) => setTimeout(resolve, 600));
      StorageService.updateLendingBook(editBookData.id, {
        title: editBookData.title.trim(),
        author: editBookData.author.trim(),
        isbn: editBookData.isbn ? editBookData.isbn.trim() : "",
      });
      loadBooks();
      showToastNotification("Book updated successfully", "success");
      closeEditModal();
    } catch (err) {
      showToastNotification("Unable to save changes", "error");
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
    setTimeout(() => navigate("/"), 500);
  };

  const handleApprove = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: "approve" });
      await new Promise((resolve) => setTimeout(resolve, 600));
      const book = lendingBooks.find((b) => b.id === bookId);
      if (!book) return;
      const today = new Date().toISOString().split("T")[0];
      StorageService.updateLendingBook(bookId, { status: "onloan", dateBorrowed: today });
      loadBooks();
      showToastNotification(
        `Book request approved! ${book?.borrower || "Borrower"} has been notified.`,
        "success"
      );
      setActiveTab("lending");
    } catch {
      showToastNotification("An error occurred while approving the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleDecline = async (bookId) => {
    try {
      setActionLoading({ id: bookId, type: "decline" });
      await new Promise((resolve) => setTimeout(resolve, 600));
      const book = lendingBooks.find((b) => b.id === bookId);
      if (!book) return;
      StorageService.deleteLendingBook(bookId);
      loadBooks();
      showToastNotification(`Book request from ${book?.borrower || "Borrower"} has been declined.`, "success");
    } catch {
      showToastNotification("An error occurred while declining the request", "error");
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const openDeleteConfirm = (bookId) => {
    const book = lendingBooks.find((b) => b.id === bookId);
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      StorageService.deleteLendingBook(bookToDelete.id);
      loadBooks();
      showToastNotification(`"${bookToDelete.title}" has been removed.`, "success");
      closeDeleteConfirm();
    } catch {
      showToastNotification("Unable to delete book. Please try again.", "error");
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
          <Link to="/dashboard">Books</Link>
          <Link to="/mybooks" className="active-link">
           Peer Reads
          </Link>
          <Link to="/profile">Profile</Link>
          <button className="logout-button nav-action-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </nav>

      <div className="mybooks-content">
        <section className="requests-section">
          <h3 className="section-title">My Lending Requests</h3>
          {pendingRequests.length > 0 ? (
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
                {pendingRequests.map((book) => (
                  <BookItem
                    key={book.id}
                    {...book}
                    onApprove={handleApprove}
                    onDecline={handleDecline}
                    onEdit={isAdmin || isOwner(book.owner) ? openEditModal : null}
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
              {visiblePublicBooks.length > 0 ? (
                visiblePublicBooks.map((book) => {
                  const canEdit = isAdmin || isOwner(book.owner);
                  return (
                    <tr
                      key={`public-${book.id}`}
                      className={`book-row ${book.status === "pending" ? "pending" : ""}`}
                    >
                      <td style={{ display: "flex", alignItems: "center" }}>
                        <img
                          src={book.image || "https://via.placeholder.com/50x70?text=No+Cover"}
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
                        {book.status === "pending" && <span className="pending-badge">Pending</span>}
                      </td>
                      <td>{book.owner || "-"}</td>
                      <td>{book.dateAdded || "-"}</td>
                      <td className="actions-cell">
                        {canEdit ? (
                          <button
                            className="action-btn decline-btn"
                            onClick={() => openDeleteConfirm(book.id)}
                          >
                            Delete
                          </button>
                        ) : book.status === "pending" ? (
                          <button className="action-btn" disabled>
                            Pending
                          </button>
                        ) : (
                          <button
                            className="action-btn request-btn"
                            onClick={() => handleRequest(book.id)}
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
          {lendingDisplay.length > 0 ? (
            <table className="books-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Borrower</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lendingDisplay.map((book) => (
                  <BookItem
                    key={book.id}
                    {...book}
                    onApprove={book.status === "pending" ? handleApprove : null}
                    onDecline={
                      book.status === "pending" ? handleDecline : () => openDeleteConfirm(book.id)
                    }
                    onEdit={isAdmin || isOwner(book.owner) ? openEditModal : null}
                    isProcessing={actionLoading.id === book.id}
                    processingType={actionLoading.type}
                  />
                ))}
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
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditModal && editBookData && (
        <div className="modal-overlay">
          <div className="modal-content edit-book-modal">
            <h4>Edit Book Details</h4>
            <form onSubmit={handleSaveEdit} className="edit-book-form">
              <label>
                Title
                <input
                  type="text"
                  value={editBookData.title}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, title: e.target.value })
                  }
                  required
                  autoFocus
                />
              </label>
              <label>
                Author
                <input
                  type="text"
                  value={editBookData.author || ""}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, author: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                ISBN (optional)
                <input
                  type="text"
                  value={editBookData.isbn || ""}
                  onChange={(e) =>
                    setEditBookData({ ...editBookData, isbn: e.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} disabled={isEditing}>
                  Cancel
                </button>
                <button type="submit" disabled={isEditing}>
                  {isEditing ? "Saving..." : "Save"}
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
