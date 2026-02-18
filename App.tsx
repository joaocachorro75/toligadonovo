import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { ProductPage } from './pages/ProductPage';
import { Blog } from './pages/Blog';
import { BlogPostPage } from './pages/BlogPostPage';
import { AdminLogin } from './pages/Admin/Login';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { AdminClients } from './pages/Admin/Clients';
import { db } from './services/db';

const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  if (!db.isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/dicas" element={<Blog />} />
        <Route path="/dicas/:slug" element={<BlogPostPage />} />
        <Route path="/produto/:slug" element={<ProductPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={
            <ProtectedRoute>
                <Navigate to="/admin/leads" replace />
            </ProtectedRoute>
        } />
        
        <Route path="/admin/clients" element={
          <ProtectedRoute>
            <AdminClients />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/leads" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
        } />
        <Route path="/admin/content" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/blog" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;