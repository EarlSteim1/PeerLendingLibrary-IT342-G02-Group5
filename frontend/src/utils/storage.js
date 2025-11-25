const STORAGE_KEYS = {
  TOKEN: "peerReads:token",
  USER: "peerReads:user",
};

const StorageService = {
  saveSession: ({ token, user }) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  updateUser: (user) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  },

  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),

  getUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  isLoggedIn: () => Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN)),
};

export default StorageService;

