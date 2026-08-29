import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import SparksPage from './pages/SparksPage';
import NotesPage from './pages/NotesPage';
import NoteDetailPage from './pages/NoteDetailPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuthStore } from './stores/authStore';

// Route guard requiring authentication
function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Public-only route (e.g. Login) redirecting to app if already authenticated
function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (token) {
    return <Navigate to="/sparks" replace />;
  }
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    )
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/sparks" replace />
      },
      {
        path: 'sparks',
        element: <SparksPage />
      },
      {
        path: 'notes',
        element: <NotesPage />
      },
      {
        path: 'notes/:filepath',
        element: <NoteDetailPage />
      },
      {
        path: 'chat',
        element: <ChatPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
