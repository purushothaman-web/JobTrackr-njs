'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (data: any) => Promise<any>;
  login: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${parsedUser.token}`;
        }

        const response = await api.get("/auth/me");

        const freshUser = {
          ...parsedUser,
          name: response.data.data.name, 
          email: response.data.data.email,
          emailVerified: response.data.data.emailVerified,
        };

        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.error("AuthContext: Failed to fetch profile", err);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const register = async (data: any) => {
    try {
      const response = await api.post("/auth/register", data);
      if (response.data.success) {
        const user = {
          id: response.data.data.id,
          name: response.data.data.name,
          email: response.data.data.email,
          token: response.data.data.token,
          emailVerified: response.data.data.emailVerified,
        };
        setUser(user);
        setError(null);
        localStorage.setItem("user", JSON.stringify(user));
        if (user.token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
        }
        return response;
      } else {
        setError(response.data.error || "Registration failed");
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(error.response?.data?.error || error.message || "Registration failed");
      }
    }
  };

  const login = async (data: any) => {
    try {
      const response = await api.post("/auth/login", data);
      if (response.data.success) {
        const user = {
          id: response.data.data.id,
          name: response.data.data.name,
          email: response.data.data.email,
          token: response.data.data.token,
          emailVerified: response.data.data.emailVerified,
        };
        setUser(user);
        setError(null);
        localStorage.setItem("user", JSON.stringify(user));
        if (user.token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
        }
        return response;
      } else {
        setError(response.data.error || "Login failed");
      }
    } catch (error: any) {
        // console.error(error);
      if (error.response?.status === 429) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(error.response?.data?.error || error.message || "Login failed");
      }
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout"); 
    } catch (err) {
      console.warn("Logout failed or already expired");
    }
    setUser(null);
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    router.push('/');
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await api.put("/auth/update-profile", data);
      if (response.data.success) {
        setUser((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                name: response.data.data.name,
                email: response.data.data.email,
            }
        });
        setError(null);
        // Also update local storage
        const stored = localStorage.getItem("user");
        if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = response.data.data.name;
            parsed.email = response.data.data.email;
            localStorage.setItem("user", JSON.stringify(parsed));
        }
        return response.data.data;
      } else {
        setError(response.data.error || "Profile update failed");
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || "Profile update failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
