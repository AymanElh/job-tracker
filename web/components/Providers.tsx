'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        retry: (failureCount, error: any) => {
          // Don't retry on 5xx server errors
          if (error?.response?.status >= 500) return false;
          // Retry a maximum of 2 times for other errors
          return failureCount < 2;
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
