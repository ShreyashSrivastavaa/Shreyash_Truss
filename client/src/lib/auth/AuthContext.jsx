import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS, DEMO_PASSWORD, findUserByEmail, findUserById } from './demoUsers';

const AuthContext = createContext(null);
const STORAGE_KEY = 'nexus_auth_session';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = findUserById(parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage');
    }
    return null; // not logged in initially
  });

  const login = (email, password) => {
    const user = findUserByEmail(email);
    if (!user) {
      throw new Error('User not found. Use one of the demo accounts listed below.');
    }
    if (password !== DEMO_PASSWORD) {
      throw new Error('Incorrect password. Default demo password is "Nexus@2026"');
    }

    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
    } catch (e) {
      console.error(e);
    }
    return user;
  };

  const loginAsUser = (userId) => {
    const user = findUserById(userId);
    if (!user) throw new Error('User not found');
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
    } catch (e) {
      console.error(e);
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  const switchRole = (userId) => {
    return loginAsUser(userId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        loginAsUser,
        logout,
        switchRole,
        demoUsers: DEMO_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

