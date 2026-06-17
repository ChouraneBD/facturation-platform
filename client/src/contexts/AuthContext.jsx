import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'facturation-platform-session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (session?.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = (newSession) => {
    setSession(newSession);
  };

  const logout = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isAuthenticated: !!session?.token, user: session?.user }}>
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
