import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Create a provider to wrap our entire app
export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check the user's session once when the app loads
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/profile', { credentials: 'include' });
        if (res.ok) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch (error) {
        // If there's a network or server error, assume not authenticated
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // Provide both isAuth and a setter function in case we log in or out
  return (
    <AuthContext.Provider value={{ isAuth, setIsAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
}