import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Footer from './Footer';
import BroadcastBanner from './BroadcastBanner';

// The logged-out "marketing site" shell — no sidebar, a normal full-page
// scroll, and the full footer. Only shown to guests; AppLayout takes over
// once the user signs in.

const LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/listings', label: 'Cars' },
  { to: '/about',    label: 'About Us' },
  { to: '/contact',  label: 'Contact' },
];

const PublicLayout = () => {
  const { cartItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  return (
    <div className="flex flex-col min-h-screen bg-primary-950">
      <BroadcastBanner />
      <nav className="glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center group">
              <img
                src="/logo.jpg"
                alt="Auto Majid Logo"
                className="h-14 w-auto object-contain group-hover:drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-all duration-300 rounded-xl"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="text-primary-200 hover:text-white font-medium transition-colors">
                  {l.label}
                </Link>
              ))}
              <Link to="/cart" className="relative p-2 text-white hover:text-accent transition-colors">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-950 bg-accent rounded-full transform translate-x-1/4 -translate-y-1/4">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/login" className="btn-outline">Sign In</Link>
              <Link to="/register" className="btn-primary">Book Now</Link>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                className="text-white focus:outline-none p-2 bg-primary-800 hover:bg-primary-700 rounded-md transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 bg-black/60"
                onClick={() => setIsMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="glass-strong absolute right-0 top-0 h-full w-full max-w-xs sm:max-w-sm overflow-y-auto px-4 pt-6 pb-6 space-y-2 shadow-2xl"
              >
                <div className="flex justify-end mb-2">
                  <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="text-white p-2 bg-primary-800 hover:bg-primary-700 rounded-md transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {LINKS.map((l) => (
                  <Link key={l.to} onClick={() => setIsMenuOpen(false)} to={l.to} className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">
                    {l.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-3 pt-4 border-t border-primary-800">
                  <Link onClick={() => setIsMenuOpen(false)} to="/cart" className="text-white hover:text-accent flex items-center justify-center py-2">
                    <ShoppingCart className="h-5 w-5 mr-2" /> Cart ({cartCount})
                  </Link>
                  <Link onClick={() => setIsMenuOpen(false)} to="/login" className="btn-outline text-center block py-3">Sign In</Link>
                  <Link onClick={() => setIsMenuOpen(false)} to="/register" className="btn-primary text-center block py-3">Book Now</Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
