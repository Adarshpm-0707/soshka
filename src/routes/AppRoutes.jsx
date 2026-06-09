import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '../components/Reusable/ScrollToTop';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Lazy load or import pages directly
import HomePage from '../pages/Home/HomePage';
import ProductsPage from '../pages/Products/ProductsPage';
import ProductDetailPage from '../pages/ProductDetails/ProductDetailPage';
import CartPage from '../pages/Cart/CartPage';
import CheckoutPage from '../pages/Checkout/CheckoutPage';
import PaymentPage from '../pages/Payment/PaymentPage';
import PaymentStatus from '../pages/Payment/PaymentStatus';
import OrdersPage from '../pages/Orders/OrdersPage';
import OrderDetail from '../pages/Orders/OrderDetail';
import WishlistPage from '../pages/Wishlist/WishlistPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import AboutPage from '../pages/About/AboutPage';
import ContactPage from '../pages/Contact/ContactPage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Customer Routes inside MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Customer Routes */}
        <Route 
          path="checkout" 
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="payment" 
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="orders" 
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="orders/:id" 
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="wishlist" 
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Admin Routes inside AdminLayout */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<div className="p-6 text-xl">Admin Dashboard (Incoming Feature)</div>} />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-xl font-bold">404 - Page Not Found</div>} />
    </Routes>
    </>
  );
};

export default AppRoutes;
