import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation - check credentials
    if (email.toLowerCase() === "demo@zerocode.com" && password === "demo123") {
      const mockUser = { id: "1", email, name: "Demo User" };
      const mockToken = "mock-jwt-token-" + Date.now();

      localStorage.setItem("authToken", mockToken);
      localStorage.setItem("userData", JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true, user: mockUser };
    }

    throw new Error("Invalid email or password");
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const mockUser = { id: Date.now().toString(), email, name };
    const mockToken = "mock-jwt-token-" + Date.now();

    localStorage.setItem("authToken", mockToken);
    localStorage.setItem("userData", JSON.stringify(mockUser));
    setUser(mockUser);
    return { success: true, user: mockUser };
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
  };

  return { user, isLoading, login, register, logout };
};

export type { User };
