import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin, MessageCircle, Share2, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-950 text-white pt-16 pb-8 border-t border-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-white">
              <Car className="h-8 w-8 text-accent" />
              <span className="font-bold text-2xl tracking-tight">AUTO <span className="text-accent">MAJID</span></span>
            </Link>
            <p className="text-primary-300 text-sm leading-relaxed">
              Premium automotive dealership offering the finest selection of luxury, performance, and everyday reliable vehicles.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-primary-400 hover:text-accent transition-colors"><MessageCircle className="h-5 w-5" /></a>
              <a href="#" className="text-primary-400 hover:text-accent transition-colors"><Share2 className="h-5 w-5" /></a>
              <a href="#" className="text-primary-400 hover:text-accent transition-colors"><Globe className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3 text-sm text-primary-300">
              <li><Link to="/listings" className="hover:text-accent transition-colors">Browse Inventory</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-accent transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Contact Us</h3>
            <ul className="space-y-4 text-sm text-primary-300">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-accent shrink-0" />
                <span>123 Majid Boulevard, Auto District, NY 10001</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-accent shrink-0" />
                <span>sales@automajid.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Newsletter</h3>
            <p className="text-primary-400 text-sm mb-4">Subscribe to receive exclusive offers and updates.</p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email address" 
                className="px-4 py-2 w-full bg-primary-900 border border-primary-800 text-white rounded-l-md focus:ring-1 focus:ring-accent outline-none placeholder:text-primary-500"
              />
              <button className="bg-accent px-4 py-2 rounded-r-md text-primary-950 font-bold hover:bg-accent-hover transition-colors">
                Subscribe
              </button>
            </form>
          </div>

        </div>
        
        <div className="border-t border-primary-800 pt-8 text-center text-sm text-primary-400">
          <p>&copy; {new Date().getFullYear()} AUTO MAJID Dealership Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
