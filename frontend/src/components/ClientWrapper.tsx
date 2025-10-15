'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  );
}