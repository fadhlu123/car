import React from 'react';
import { useAuth } from '../context/AuthContext';
import PublicLayout from './PublicLayout';
import AppLayout from './AppLayout';

// Picks the shell based on auth state: guests get the full marketing site
// (PublicLayout), logged-in users get the fixed-height sidebar app shell
// (AppLayout). Both render the same nested <Outlet /> routes.
const RootLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  return user ? <AppLayout /> : <PublicLayout />;
};

export default RootLayout;
