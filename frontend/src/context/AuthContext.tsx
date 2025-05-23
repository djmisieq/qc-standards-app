import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  // Configure axios to use token in all requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data on init or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Decode token to get basic user info (simple approach)
        const decoded: any = jwtDecode(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
          return;
        }

        // Try to fetch user data from API
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await axios.get(`${apiUrl}/users/me`);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to load user:', error);
        logout();
      }
    };

    loadUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
