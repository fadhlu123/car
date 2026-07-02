import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useLenis } from './hooks/useLenis';
import { usePush } from './hooks/usePush';
import { ENV } from './configs/env.config';
import RootLayout from './components/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Listings from './pages/Listings';
import CarDetail from './pages/CarDetail';
import About from './pages/About';
import Contact from './pages/Contact';
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

// Registers the service worker + push subscription once a user is logged in.
// Rendered inside AuthProvider so useAuth() (and thus usePush) has context.
const PushRegistrar = () => {
  usePush();
  return null;
};

function App() {
  useLenis();

  return (
    <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <PushRegistrar />
            <Routes>
              <Route path="/login"           element={<Login />} />
              <Route path="/register"        element={<Register />} />
              <Route path="/verify-email"    element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              <Route path="/" element={<RootLayout />}>
                <Route index                 element={<Home />} />
                <Route path="listings"       element={<Listings />} />
                <Route path="listings/:id"   element={<CarDetail />} />
                <Route path="about"          element={<About />} />
                <Route path="contact"        element={<Contact />} />
                <Route path="cart"           element={<Cart />} />
                <Route path="order-confirmation" element={<OrderConfirmation />} />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
