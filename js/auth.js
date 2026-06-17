/**
 * Firebase Authentication Module
 */

window.Auth = {
  _user: null,

  // Wait for the initial Firebase auth state to resolve
  init() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const username = user.email.split('@')[0];
          this._user = {
            uid: user.uid,
            email: user.email,
            username: username,
            name: user.displayName || username,
          };
          
          try {
            const docSnap = await db.collection("users").doc(username).get();
            if (docSnap.exists) {
              this._user = { ...this._user, ...docSnap.data() };
            }
          } catch (e) {
            console.warn("Could not load extended profile", e);
          }
        } else {
          this._user = null;
        }
        resolve(this._user);
      });
    });
  },

  isLoggedIn() {
    return this._user !== null;
  },

  currentUser() {
    return this._user;
  },

  _formatEmail(input) {
    input = input.trim().toLowerCase().replace(/\s+/g, '_');
    if (input.includes('@')) return input;
    return `${input}@netcert.app`;
  },

  async login(idOrEmail, password) {
    const username = idOrEmail.trim().toLowerCase().replace(/\s+/g, '_');
    const email = this._formatEmail(idOrEmail);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      this._user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: username,
        name: userCredential.user.displayName || username,
      };
      
      // Load user metadata from Firestore to get XP and level
      const docSnap = await db.collection("users").doc(username).get();
      if (docSnap.exists) {
        this._user = { ...this._user, ...docSnap.data() };
      }

      return { user: this._user, xpGained: 0 };
    } catch (error) {
      throw new Error(this._getFriendlyError(error.code));
    }
  },

  async register(idOrEmail, password, fullName) {
    const username = idOrEmail.trim().toLowerCase().replace(/\s+/g, '_');
    const email = this._formatEmail(idOrEmail);
    if (!fullName || fullName.trim() === '') {
      throw new Error("請輸入姓名 / Full name is required");
    }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName: fullName });
      
      this._user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: username,
        name: fullName,
        xp: 0,
        level: 1,
        streak: 0
      };

      // Create initial progress document in Firestore using the Username as the Document ID!
      await db.collection("users").doc(username).set({
        uid: userCredential.user.uid,
        username: username,
        name: fullName,
        email: email,
        xp: 0,
        level: 1,
        streak: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { user: this._user };
    } catch (error) {
      throw new Error(this._getFriendlyError(error.code));
    }
  },

  async logout() {
    await auth.signOut();
    this._user = null;
    app.showLogin();
  },

  getInitials(name) {
    if (!name) return 'NC';
    // For English names like "John Doe", return JD. For Chinese like "陳品睿", return 陳品.
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  _getFriendlyError(code) {
    switch (code) {
      case 'auth/invalid-email': return '無效的電子郵件格式 / Invalid email format';
      case 'auth/user-not-found': return '找不到此帳號 / User not found';
      case 'auth/wrong-password': return '密碼錯誤 / Incorrect password';
      case 'auth/email-already-in-use': return '此帳號已被註冊 / Email already in use';
      case 'auth/weak-password': return '密碼至少需要 6 個字元 / Password must be at least 6 characters';
      case 'auth/invalid-credential': return '帳號或密碼錯誤 / Invalid credentials';
      default: return `認證失敗 (${code})`;
    }
  }
};
