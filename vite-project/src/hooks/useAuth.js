import { useState, useEffect } from "react";
import { AuthService } from "@/services/authService.js";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Ensure demo user is set up
      AuthService.setupDemoUser();

      // Use the correct localStorage key that AuthService uses
      const token = localStorage.getItem("zerocode_session");

      if (token) {
        try {
          // Verify token
          const userData = await AuthService.verifyToken(token);
          setUser({ ...userData, token });
        } catch (error) {
          console.error("Token verification failed:", error);
          // Clear invalid session data using correct keys
          localStorage.removeItem("zerocode_session");
          localStorage.removeItem("zerocode_current_user");
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await AuthService.login({ email, password });

      // The AuthService already stores the token with correct keys
      // Just update our local state
      const userWithToken = { ...response.user, token: response.token };

      // Force state update
      setUser(userWithToken);

      console.log("Login successful, user state updated:", userWithToken);

      return { success: true, user: userWithToken };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    try {
      const response = await AuthService.register({ name, email, password });

      // The AuthService already stores the token with correct keys
      // Just update our local state
      const userWithToken = { ...response.user, token: response.token };

      // Force state update
      setUser(userWithToken);

      console.log(
        "Registration successful, user state updated:",
        userWithToken,
      );

      return { success: true, user: userWithToken };
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // AuthService.logout() already clears the correct localStorage keys
      setUser(null);
    }
  };

  return { user, isLoading, login, register, logout };
};
