import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-white">
            <Car className="h-8 w-8 text-accent" />
            <span className="font-bold text-2xl tracking-tight">AUTO <span className="text-accent">MAJID</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-primary-200 hover:text-white font-medium transition-colors">Home</Link>
            <Link to="/listings" className="text-primary-200 hover:text-white font-medium transition-colors">Cars</Link>
            <Link to="/about" className="text-primary-200 hover:text-white font-medium transition-colors">About Us</Link>
            <Link to="/contact" className="text-primary-200 hover:text-white font-medium transition-colors">Contact</Link>
            
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-white font-medium hover:text-accent transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center border border-primary-700">
                    <UserIcon className="h-4 w-4 text-accent" />
                  </div>
                  <span>{user.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-primary-900 border border-primary-800 shadow-xl rounded-xl py-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-primary-200 hover:bg-primary-800 hover:text-white">Admin Dashboard</Link>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-sm text-primary-200 hover:bg-primary-800 hover:text-white">My Profile</Link>
                  <Link to="/my-bookings" className="block px-4 py-2 text-sm text-primary-200 hover:bg-primary-800 hover:text-white">My Bookings</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-primary-800 hover:text-red-300">Logout</button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-4 items-center">
                <Link to="/login" className="btn-outline">Sign In</Link>
                <Link to="/register" className="btn-primary">Book Now</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none p-2 bg-primary-800 rounded-md">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-primary-800 px-4 pt-2 pb-6 space-y-2 absolute w-full shadow-2xl">
          <Link to="/" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">Home</Link>
          <Link to="/listings" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">Cars</Link>
          <Link to="/about" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">About Us</Link>
          <Link to="/contact" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">Contact</Link>
          {user ? (
            <>
               <div className="border-t border-primary-800 my-2 pt-2"></div>
               {user.role === 'admin' && (
                 <Link to="/admin" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">Admin Dashboard</Link>
               )}
               <Link to="/profile" className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-primary-800">My Profile</Link>
               <button onClick={logout} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-primary-800">Logout</button>
            </>
          ) : (
            <div className="flex flex-col space-y-3 pt-4 border-t border-primary-800">
              <Link to="/login" className="btn-outline text-center block py-3">Sign In</Link>
              <Link to="/register" className="btn-primary text-center block py-3">Book Now</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
