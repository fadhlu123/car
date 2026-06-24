import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BroadcastBanner from './components/BroadcastBanner';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Listings from './pages/Listings';
import CarDetail from './pages/CarDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Customer pages (protected)
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <BroadcastBanner />
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/"                  element={<Home />} />
                <Route path="/listings"          element={<Listings />} />
                <Route path="/listings/:id"      element={<CarDetail />} />
                <Route path="/login"             element={<Login />} />
                <Route path="/register"          element={<Register />} />
                <Route path="/verify-email"      element={<VerifyEmail />} />
                <Route path="/forgot-password"   element={<ForgotPassword />} />
                <Route path="/reset-password"    element={<ResetPassword />} />
                <Route path="/cart"              element={<Cart />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
