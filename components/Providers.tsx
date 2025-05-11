'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { StoreProvider } from '@/context/storeContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/app/components/ui/ThemeProvider';

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <StoreProvider>
        <ThemeProvider>
          <Toaster position="top-right" />
          {children}
        </ThemeProvider>
      </StoreProvider>
    </SessionProvider>
  );
} 