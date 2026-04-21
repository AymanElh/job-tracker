'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized, isInitialized } = useAuthStore();

  useEffect(() => {
    const rehydrateSession = async () => {
      // Check if we already have a token in memory
      const currentToken = useAuthStore.getState().token;
      
      if (!currentToken) {
        try {
          // Attempt to refresh the token using the HttpOnly cookie
          const response = await api.post('/auth/refresh-token');
          const { token, data } = response.data;
          setAuth(data.user, token);
        } catch (error) {
          // Refresh failed, user is not logged in / session expired
          console.log('Session rehydration failed: Not logged in or session expired');
        }
      }
      
      setInitialized(true);
    };

    rehydrateSession();
  }, [setAuth, setInitialized]);

  // Optionally show a loading state while rehydrating
  // if (!isInitialized) return null;

  return <>{children}</>;
}
