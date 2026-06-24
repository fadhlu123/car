import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Team from './pages/Team';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Broadcasts from './pages/Broadcasts';
import AcceptInvite from './pages/AcceptInvite';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route
            path="/"
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders"   element={<Orders />} />
            <Route path="products" element={<Products />} />
            <Route path="users"    element={<Users />} />
            <Route path="team"     element={<Team />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="broadcasts" element={<Broadcasts />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
