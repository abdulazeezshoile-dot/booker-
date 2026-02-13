import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const dummyUser = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(dummyUser);
  const login = (email, password) => {
    // Dummy login: return Admin for email containing admin
    const isAdmin = email.includes('admin');
    setUser({ name: 'Demo User', email, role: isAdmin ? 'Admin' : 'Manager', branches: ['Main Store', 'Outlet'] });
  };
  const logout = () => setUser(null);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
