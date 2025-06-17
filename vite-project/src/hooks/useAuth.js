import { useState, useEffect, createContext, useContext } from "react";

// Mock user database (in real app, this would be an API)
const MOCK_USERS = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@zerocode.com",
    password: "demo123",
  },
];

// In-memory storage for registered users (in real app, this would be a database)
let registeredUsers = [...MOCK_USERS];

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem("zerocode_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("zerocode_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find user in registered users
      const foundUser = registeredUsers.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.password === password,
      );

      if (!foundUser) {
        throw new Error(
          "Invalid email or password. Please check your credentials and try again.",
        );
      }

      // Create user session (exclude password)
      const userSession = {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        loginTime: new Date().toISOString(),
      };

      // Save to localStorage and state
      localStorage.setItem("zerocode_user", JSON.stringify(userSession));
      setUser(userSession);

      return { success: true, user: userSession };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user already exists
      const existingUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (existingUser) {
        throw new Error(
          "An account with this email already exists. Please sign in instead.",
        );
      }

      // Validate input
      if (!name.trim()) {
        throw new Error("Please enter your full name.");
      }
      if (!email.trim()) {
        throw new Error("Please enter a valid email address.");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        registeredAt: new Date().toISOString(),
      };

      // Add to registered users
      registeredUsers.push(newUser);

      // Create user session (exclude password)
      const userSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        registeredAt: newUser.registeredAt,
      };

      // Save to localStorage and state
      localStorage.setItem("zerocode_user", JSON.stringify(userSession));
      setUser(userSession);

      return { success: true, user: userSession };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("zerocode_user");
    setUser(null);
  };

  const clearError = () => {
    // This can be used to clear any auth-related errors
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user,
  };
};
