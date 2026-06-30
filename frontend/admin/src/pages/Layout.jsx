import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Car, LayoutDashboard, ShoppingBag, Menu, LogOut, ChevronRight, Users as UsersIcon, UserCog, Megaphone, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const NAV = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/orders',      label: 'Orders',      icon: ShoppingBag },
  { to: '/products',    label: 'Products',    icon: Car },
  { to: '/users',       label: 'Users',       icon: UsersIcon },
  { to: '/team',        label: 'Team',        icon: UserCog },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/broadcasts',  label: 'Broadcasts',  icon: Megaphone },
];

const SideNav = ({ onNav, admin, onLogout }) => (
  <nav className="flex flex-col h-full">
    <div className="p-6 border-b border-primary-800">
      <div className="flex items-center group cursor-pointer">
        <img src="/logo.jpg" alt="Auto Majid Logo" className="h-12 w-auto object-contain group-hover:drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-all duration-300 rounded-xl" />
      </div>
      <p className="text-xs text-primary-500 mt-1">Admin Panel</p>
    </div>

    <ul className="grow p-4 space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-accent text-primary-950' : 'text-primary-300 hover:bg-primary-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
          </NavLink>
        </li>
      ))}
    </ul>

    <div className="p-4 border-t border-primary-800">
      <div className="flex items-center gap-3 px-4 py-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">
            {admin?.first_name?.[0]}{admin?.last_name?.[0]}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{admin?.first_name} {admin?.last_name}</p>
          <p className="text-xs text-primary-500 capitalize">{admin?.role}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-primary-800 hover:text-red-300 rounded-xl transition-colors"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  </nav>
);

const Layout = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-primary-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-900 border-r border-primary-800 shrink-0">
        <SideNav admin={admin} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-primary-900 flex flex-col z-10">
            <SideNav admin={admin} onLogout={handleLogout} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="grow flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-primary-800 bg-primary-900">
          <button onClick={() => setOpen(true)} className="text-white p-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Auto Majid Logo" className="h-10 w-auto object-contain rounded-xl" />
          </div>
          <NotificationBell />
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-primary-800 bg-primary-900/40">
          <NotificationBell />
        </header>

        <main className="grow p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
