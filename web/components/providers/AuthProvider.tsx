'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized, isInitialized } = useAuthStore();

  useEffect(() => {
    const rehydrateSession = async () => {
      // Check if we already have a token in memory (e.g., same tab, no refresh)
      const currentToken = useAuthStore.getState().token;
      
      if (!currentToken) {
        try {
          // Attempt to refresh the access token using the HttpOnly refreshToken cookie.
          // This runs on every page load when there's no in-memory token.
          const response = await api.post('/auth/refresh-token');
          const { token, data } = response.data;
          setAuth(data.user, token);
        } catch (error) {
          // Refresh failed — the refreshToken cookie is absent or expired.
          // The middleware will handle the redirect on the next navigation.
          console.log('Session rehydration failed: session expired or not logged in.');
        }
      }
      
      setInitialized(true);
    };

    rehydrateSession();
  }, [setAuth, setInitialized]);

  // Block rendering until we know the auth state.
  // This prevents the protected page from briefly flashing with no user/token.
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'hsl(224 71% 4%)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

