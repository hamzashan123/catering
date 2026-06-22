import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import html from '../utils/html';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    const token = localStorage.getItem('bookin_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('bookin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });

      localStorage.setItem('bookin_token', response.data.token);
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    await loadUser();
  }

  function logout() {
    localStorage.removeItem('bookin_token');
    setUser(null);
  }

  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin'
  };

  return html`<${AuthContext.Provider} value=${value}>${children}</${AuthContext.Provider}>`;
}

export function useAuth() {
  return useContext(AuthContext);
}
