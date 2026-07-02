import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Home as HomeIcon, Car, Info, Phone, ShoppingCart, User as UserIcon, Calendar, Menu, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';
import BroadcastBanner from './BroadcastBanner';

// The logged-in "app shell" — fixed to the viewport height with its own
// internally-scrolling content pane (like a dashboard), as opposed to
// PublicLayout's normal, fully-scrolling marketing page.

const SideNav = ({ user, cartCount, onNav, onLogout }) => {
  const NAV = [
    { to: '/',         label: 'Home',        icon: HomeIcon, end: true },
    { to: '/listings', label: 'Cars',        icon: Car },
    { to: '/about',    label: 'About Us',    icon: Info },
    { to: '/contact',  label: 'Contact',     icon: Phone },
    { to: '/cart',     label: 'Cart',        icon: ShoppingCart, badge: cartCount },
    { to: '/profile',     label: 'My Profile',  icon: UserIcon },
    { to: '/my-bookings', label: 'My Bookings', icon: Calendar },
  ];

  return (
    <nav className="flex flex-col h-full">
      <div className="p-6 border-b border-primary-800">
        <Link to="/" className="flex items-center group" onClick={onNav}>
          <img src="/logo.jpg" alt="Auto Majid Logo" className="h-12 w-auto object-contain group-hover:drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-all duration-300 rounded-xl" />
        </Link>
        <p className="text-xs text-primary-500 mt-1">Auto Majid</p>
      </div>

      <ul className="grow p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
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
              {badge > 0 ? (
                <span className="ml-auto bg-accent text-primary-950 text-xs font-bold rounded-full px-2 py-0.5">{badge}</span>
              ) : (
                <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-4 border-t border-primary-800">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-primary-500 truncate">{user?.email}</p>
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
};

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const [open, setOpen] = useState(false);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="h-screen flex flex-col bg-primary-950 overflow-hidden">
      <div className="shrink-0">
        <BroadcastBanner />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 glass border-r border-primary-800 shrink-0">
          <SideNav user={user} cartCount={cartCount} onLogout={logout} />
        </aside>

        {/* Mobile sidebar overlay */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <aside className="relative w-64 glass-strong flex flex-col z-10">
              <SideNav
                user={user}
                cartCount={cartCount}
                onNav={() => setOpen(false)}
                onLogout={() => { setOpen(false); logout(); }}
              />
            </aside>
          </div>
        )}

        <div className="grow flex flex-col min-w-0 min-h-0">
          {/* Mobile topbar */}
          <header className="lg:hidden glass shrink-0 flex items-center justify-between px-4 py-4 border-b border-primary-800">
            <button onClick={() => setOpen(true)} className="text-white p-1">
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center">
              <img src="/logo.jpg" alt="Auto Majid Logo" className="h-10 w-auto object-contain rounded-xl" />
            </Link>
            <NotificationBell />
          </header>

          {/* Desktop topbar */}
          <header className="hidden lg:flex glass shrink-0 items-center justify-end px-6 py-3 border-b border-primary-800">
            <NotificationBell />
          </header>

          <main id="app-scroll-container" className="grow overflow-y-auto min-h-0">
            <Outlet />
            <footer className="px-6 py-4 text-center text-xs text-primary-500 border-t border-primary-800/50 mt-8">
              &copy; {new Date().getFullYear()} AUTO MAJID
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
