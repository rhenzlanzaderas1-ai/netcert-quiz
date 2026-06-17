/**
 * Custom Firestore Authentication Module (No Firebase Auth)
 */

window.Auth = {
  _user: null,

  // Wait for the initial auth state to resolve
  init() {
    return new Promise((resolve) => {
      const savedUsername = localStorage.getItem('nc-username');
      if (savedUsername) {
        db.collection("users").doc(savedUsername).get()
          .then(docSnap => {
            if (docSnap.exists) {
              this._user = docSnap.data();
              resolve(this._user);
            } else {
              this.logout();
              resolve(null);
            }
          })
          .catch(e => {
            console.warn("Auth init failed:", e);
            resolve(null);
          });
      } else {
        resolve(null);
      }
    });
  },

  isLoggedIn() {
    return this._user !== null;
  },

  currentUser() {
    return this._user;
  },

  async login(username, password) {
    username = username.trim().toLowerCase().replace(/\s+/g, '_');
    
    try {
      const docSnap = await db.collection("users").doc(username).get();
      if (!docSnap.exists) {
        throw new Error('找不到此帳號 / User not found');
      }
      
      const userData = docSnap.data();
      if (userData.password !== password) {
        throw new Error('密碼錯誤 / Incorrect password');
      }

      this._user = userData;
      localStorage.setItem('nc-username', username);
      return { user: this._user, xpGained: 0 };
    } catch (error) {
      throw new Error(error.message || "登入失敗");
    }
  },

  async register(username, password, fullName) {
    username = username.trim().toLowerCase().replace(/\s+/g, '_');
    if (!fullName || fullName.trim() === '') {
      throw new Error("請輸入姓名 / Full name is required");
    }
    if (!password || password.length < 6) {
      throw new Error("密碼至少需要 6 個字元 / Password must be at least 6 characters");
    }

    try {
      // Check if user exists
      const docSnap = await db.collection("users").doc(username).get();
      if (docSnap.exists) {
        throw new Error('此帳號已被註冊 / Username already in use');
      }

      this._user = {
        uid: username, // Added for compatibility
        username: username,
        name: fullName,
        password: password, // Stored in plain text per request for simplicity
        xp: 0,
        level: 1,
        streak: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("users").doc(username).set(this._user);
      localStorage.setItem('nc-username', username);

      return { user: this._user };
    } catch (error) {
      throw new Error(error.message || "註冊失敗");
    }
  },

  async logout() {
    localStorage.removeItem('nc-username');
    this._user = null;
    app.showLogin();
  },

  getInitials(name) {
    if (!name) return 'NC';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
};
