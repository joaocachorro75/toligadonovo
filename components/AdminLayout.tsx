
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Newspaper, ShoppingCart, Menu, X, Building2 } from 'lucide-react';
import { db } from '../services/db';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    db.logout();
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/clients', icon: Building2, label: 'Clientes' },
    { path: '/admin/leads', icon: Users, label: 'Leads' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Vendas/Assinaturas' },
    { path: '/admin/content', icon: FileText, label: 'Produtos' },
    { path: '/admin/blog', icon: Newspaper, label: 'Blog & Dicas' },
    { path: '/admin/settings', icon: Settings, label: 'Configurações' },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-gray-950 border-b border-gray-800 z-30 px-4 h-16 flex items-center justify-between">
         <div className="font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Painel Admin
         </div>
         <button onClick={toggleSidebar} className="p-2 text-gray-300 hover:text-white">
            {isSidebarOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Overlay Backdrop for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static top-0 left-0 h-full w-64 bg-gray-950 border-r border-gray-800 flex flex-col z-40
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 hidden lg:block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Painel Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1">To-Ligado.com</p>
        </div>

        {/* Mobile Logo inside Sidebar */}
        <div className="p-6 lg:hidden flex justify-between items-center">
             <span className="font-bold text-xl">Menu</span>
             <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false); // Close on mobile click
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-900 w-full pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};
