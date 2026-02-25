import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LayoutDashboard, FolderKanban, Image, Receipt, Settings, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/assets', icon: Image, label: 'Assets' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminItems = [
  { to: '/admin/clients', icon: Users, label: 'Clients' },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.role === 'staff';
  const items = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <div className="min-h-screen bg-[#07080a] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-2 border-r border-gray-800/50 transform transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800/50">
          <h1 className="text-lg font-bold text-white">Local Connect</h1>
          <p className="text-xs text-gray-500 mt-0.5">{user?.name} · {user?.role}</p>
        </div>
        <nav className="p-4 space-y-1">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 w-full">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-[#07080a]/80 backdrop-blur border-b border-gray-800/50 px-6 py-4 flex items-center lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-gray-400"><Menu size={24} /></button>
          <span className="ml-4 text-sm font-medium text-white">Local Connect</span>
        </header>
        <div className="p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
