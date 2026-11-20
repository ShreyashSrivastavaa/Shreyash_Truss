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
        if (parsed.user) return parsed.user;
        const match = findUserById(parsed.id);
        if (match) return match;
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage');
    }
    return null; // not logged in initially
  });

  // Verify backend session on mount
  useEffect(() => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) return;
    try {
      const parsed = JSON.parse(session);
      if (parsed.token) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${parsed.token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.user) {
              const demoMatch = findUserByEmail(data.user.email);
              const combined = {
                ...(demoMatch || {}),
                ...data.user,
                title: demoMatch?.title || data.user.role,
                avatar: demoMatch?.avatar || (data.user.name ? data.user.name.split(' ').map(n => n[0]).join('') : 'U'),
                badgeColor: demoMatch?.badgeColor || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              };
              setCurrentUser(combined);
            }
          })
          .catch(() => {});
      }
    } catch (e) {}
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        const demoMatch = findUserByEmail(email);
        const combinedUser = {
          ...(demoMatch || {}),
          ...data.user,
          title: demoMatch?.title || data.user.role,
          avatar: demoMatch?.avatar || (data.user.name ? data.user.name.split(' ').map(n => n[0]).join('') : 'U'),
          badgeColor: demoMatch?.badgeColor || 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          defaultMode: demoMatch?.defaultMode || 'detailed',
          allowedTabs: demoMatch?.allowedTabs || ['INVENTORY', 'VENDORS']
        };

        setCurrentUser(combinedUser);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id: data.user.id, email: data.user.email, token: data.token, user: combinedUser })
        );
        return combinedUser;
      }
    } catch (e) {
      console.warn('Backend login failed, evaluating fallback demo authentication:', e);
    }

    // Fallback for static demo accounts
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

  const loginAsUser = async (userId) => {
    const user = findUserById(userId);
    if (!user) throw new Error('User not found');
    return login(user.email, DEMO_PASSWORD);
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

