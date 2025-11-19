// Centralized storage management for Peer Reads
const STORAGE_KEYS = {
  LENDING_BOOKS: "peerReads:lendingBooks",
  USER_PROFILE: "peerReads:userProfile",
  USER_SESSION: "peerReads:userSession",
  BORROWING_BOOKS: "peerReads:borrowingBooks",
};

export const StorageService = {
  // Books Management
  getLendingBooks: () => {
    try {
      const books = localStorage.getItem(STORAGE_KEYS.LENDING_BOOKS);
      return books ? JSON.parse(books) : [];
    } catch (error) {
      console.error("Error loading lending books:", error);
      return [];
    }
  },

  saveLendingBooks: (books) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LENDING_BOOKS, JSON.stringify(books));
    } catch (error) {
      console.error("Error saving lending books:", error);
    }
  },

  addLendingBook: (book) => {
    const books = StorageService.getLendingBooks();
    const newBook = {
      ...book,
      id: Date.now(), // Generate unique ID
      dateAdded: new Date().toISOString().split('T')[0],
      status: book.status || "available",
    };
    books.push(newBook);
    StorageService.saveLendingBooks(books);
    return newBook;
  },

  updateLendingBook: (bookId, updates) => {
    const books = StorageService.getLendingBooks();
    const updated = books.map(book =>
      book.id === bookId ? { ...book, ...updates } : book
    );
    StorageService.saveLendingBooks(updated);
    return updated;
  },

  deleteLendingBook: (bookId) => {
    const books = StorageService.getLendingBooks();
    const filtered = books.filter(book => book.id !== bookId);
    StorageService.saveLendingBooks(filtered);
    return filtered;
  },

  // User Profile Management
  getUserProfile: () => {
    try {
      const profile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error("Error loading user profile:", error);
      return null;
    }
  },

  saveUserProfile: (profile) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  },

  // Session Management
  setUserSession: (username) => {
    try {
      const session = {
        username,
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    } catch (error) {
      console.error("Error setting session:", error);
    }
  },

  getUserSession: () => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },

  clearSession: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  },

  isLoggedIn: () => {
    const session = StorageService.getUserSession();
    return session && session.loggedIn === true;
  },

  // Borrowing Books
  getBorrowingBooks: () => {
    try {
      const books = localStorage.getItem(STORAGE_KEYS.BORROWING_BOOKS);
      return books ? JSON.parse(books) : [];
    } catch (error) {
      console.error("Error loading borrowing books:", error);
      return [];
    }
  },

  saveBorrowingBooks: (books) => {
    try {
      localStorage.setItem(STORAGE_KEYS.BORROWING_BOOKS, JSON.stringify(books));
    } catch (error) {
      console.error("Error saving borrowing books:", error);
    }
  },

  // Statistics
  getStatistics: () => {
    const lendingBooks = StorageService.getLendingBooks();
    const borrowingBooks = StorageService.getBorrowingBooks();
    
    const booksLent = lendingBooks.filter(book => book.status === "onloan").length;
    const booksBorrowed = borrowingBooks.filter(book => book.status === "onloan").length;
    const pendingRequests = lendingBooks.filter(book => book.status === "pending").length;
    const availableBooks = lendingBooks.filter(book => book.status === "available").length;

    return {
      booksLent,
      booksBorrowed,
      pendingRequests,
      totalLendingBooks: lendingBooks.length,
      availableBooks,
    };
  },
};

export default StorageService;

