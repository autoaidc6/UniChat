import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser } = useStore();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/:id" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </HashRouter>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}