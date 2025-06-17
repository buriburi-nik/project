// Local authentication service - no backend required
export class AuthService {
  // Login with local storage
  static async login(credentials) {
    // Simulate API delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const { email, password } = credentials;

      // Get stored users from localStorage
      const storedUsers = JSON.parse(
        localStorage.getItem("zerocode_users") || "{}",
      );

      // Check if user exists
      const user = storedUsers[email];
      if (!user) {
        throw new Error(
          "No account found with this email. Please sign up first.",
        );
      }

      // Simple password check (in real app, you'd hash passwords)
      if (user.password !== password) {
        throw new Error("Invalid password. Please try again.");
      }

      // Create session
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store session
      localStorage.setItem("zerocode_session", sessionToken);
      localStorage.setItem(
        "zerocode_current_user",
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          loginTime: new Date().toISOString(),
        }),
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token: sessionToken,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Register new user locally
  static async register(userData) {
    // Simulate API delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const { name, email, password } = userData;

      // Get existing users
      const storedUsers = JSON.parse(
        localStorage.getItem("zerocode_users") || "{}",
      );

      // Check if user already exists
      if (storedUsers[email]) {
        throw new Error(
          "An account with this email already exists. Please sign in instead.",
        );
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        email: email.toLowerCase(),
        password: password, // In real app, hash this!
        createdAt: new Date().toISOString(),
      };

      // Store user
      storedUsers[email] = newUser;
      localStorage.setItem("zerocode_users", JSON.stringify(storedUsers));

      // Create session
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store session
      localStorage.setItem("zerocode_session", sessionToken);
      localStorage.setItem(
        "zerocode_current_user",
        JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          loginTime: new Date().toISOString(),
        }),
      );

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
        token: sessionToken,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Verify session token
  static async verifyToken(token) {
    try {
      const currentSession = localStorage.getItem("zerocode_session");

      if (!currentSession || currentSession !== token) {
        throw new Error("Invalid session");
      }

      const userData = localStorage.getItem("zerocode_current_user");
      if (!userData) {
        throw new Error("No user data found");
      }

      return JSON.parse(userData);
    } catch (error) {
      console.error("Token verification error:", error);
      throw new Error("Session expired. Please log in again.");
    }
  }

  // Logout
  static async logout() {
    try {
      localStorage.removeItem("zerocode_session");
      localStorage.removeItem("zerocode_current_user");
    } catch (error) {
      console.warn("Logout error:", error);
    }
  }

  // Get current user without token verification
  static getCurrentUser() {
    try {
      const userData = localStorage.getItem("zerocode_current_user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Demo data setup (optional)
  static setupDemoUser() {
    try {
      const demoUsers = {
        "demo@zerocode.com": {
          id: "demo_user",
          name: "Demo User",
          email: "demo@zerocode.com",
          password: "demo123",
          createdAt: new Date().toISOString(),
        },
      };

      const existingUsers = JSON.parse(
        localStorage.getItem("zerocode_users") || "{}",
      );

      // Always ensure demo user exists
      const updatedUsers = { ...existingUsers, ...demoUsers };
      localStorage.setItem("zerocode_users", JSON.stringify(updatedUsers));

      console.log(
        "Demo user setup completed. Available users:",
        Object.keys(updatedUsers),
      );
    } catch (error) {
      console.error("Failed to setup demo user:", error);
    }
  }
}

// Initialize demo user on module load
AuthService.setupDemoUser();
