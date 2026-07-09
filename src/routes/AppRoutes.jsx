import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "../components/Reusable/ScrollToTop";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import AdminProtectedRoute from "./AdminProtectedRoute";
import Loader from "../components/Reusable/Loader";

// Import Super Admin Layout & Protection (keep eager as they are layouts/guards)
import SuperAdminProtectedRoute from "./SuperAdminProtectedRoute";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

// Eager load the landing page to optimize First Contentful Paint
import HomePage from "../pages/Home/HomePage";

// Lazy load all other pages to minimize the initial JS bundle size
const AdminLoginPage = lazy(() => import("../pages/Admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("../pages/Admin/AdminDashboard"));
const AdminProductsPage = lazy(() => import("../pages/Admin/AdminProductsPage"));
const AdminAddProductPage = lazy(() => import("../pages/Admin/AdminAddProductPage"));
const AdminEditProductPage = lazy(() => import("../pages/Admin/AdminEditProductPage"));
const AdminCategoriesPage = lazy(() => import("../pages/Admin/AdminCategoriesPage"));
const AdminOffersPage = lazy(() => import("../pages/Admin/AdminOffersPage"));
const AdminOrdersPage = lazy(() => import("../pages/Admin/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("../pages/Admin/ManageCustomersPage"));
const AdminReviewsPage = lazy(() => import("../pages/Admin/AdminReviewsPage"));
const AdminLogoutPage = lazy(() => import("../pages/Admin/AdminLogoutPage"));

const SuperAdminLoginPage = lazy(() => import("../pages/SuperAdmin/SuperAdminLoginPage"));
const SuperAdminDashboard = lazy(() => import("../pages/SuperAdmin/SuperAdminDashboard"));
const ManageAdminsPage = lazy(() => import("../pages/SuperAdmin/ManageAdminsPage"));
const CreateAdminPage = lazy(() => import("../pages/SuperAdmin/CreateAdminPage"));
const SuperAdminProductsPage = lazy(() => import("../pages/SuperAdmin/SuperAdminProductsPage"));
const SuperAdminAddProductPage = lazy(() => import("../pages/SuperAdmin/SuperAdminAddProductPage"));
const SuperAdminEditProductPage = lazy(() => import("../pages/SuperAdmin/SuperAdminEditProductPage"));
const SuperAdminOrdersPage = lazy(() => import("../pages/SuperAdmin/SuperAdminOrdersPage"));
const PaymentSettingsPage = lazy(() => import("../pages/SuperAdmin/PaymentSettingsPage"));
const ActivityLogsPage = lazy(() => import("../pages/SuperAdmin/ActivityLogsPage"));
const SuperAdminLogoutPage = lazy(() => import("../pages/SuperAdmin/SuperAdminLogoutPage"));
const SuperAdminCustomersPage = lazy(() => import("../pages/SuperAdmin/ManageCustomersPage"));

const ProductsPage = lazy(() => import("../pages/Products/ProductsPage"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetails/ProductDetailPage"));
const CartPage = lazy(() => import("../pages/Cart/CartPage"));
const CheckoutPage = lazy(() => import("../pages/Checkout/CheckoutPage"));
const PaymentPage = lazy(() => import("../pages/Payment/PaymentPage"));
const OrdersPage = lazy(() => import("../pages/Orders/OrdersPage"));
const OrderDetail = lazy(() => import("../pages/Orders/OrderDetail"));
const WishlistPage = lazy(() => import("../pages/Wishlist/WishlistPage"));
const ProfilePage = lazy(() => import("../pages/Profile/ProfilePage"));
const AboutPage = lazy(() => import("../pages/About/AboutPage"));
const ContactPage = lazy(() => import("../pages/Contact/ContactPage"));
const LoginPage = lazy(() => import("../pages/Login/LoginPage"));
const RegisterPage = lazy(() => import("../pages/Register/RegisterPage"));
const ReviewsPage = lazy(() => import("../pages/Reviews/ReviewsPage"));
const TermsPage = lazy(() => import("../pages/Terms/TermsPage"));
const RefundPolicyPage = lazy(() => import("../pages/RefundPolicy/RefundPolicyPage"));
const PrivacyPolicyPage = lazy(() => import("../pages/Terms/PrivacyPolicyPage"));
const ShippingPolicyPage = lazy(() => import("../pages/Terms/ShippingPolicyPage"));

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loader fullScreen text="Loading page..." />}>
        <Routes>
          {/* Customer Routes inside MainLayout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:idOrSlug" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="returns-refunds" element={<RefundPolicyPage />} />
            <Route path="refund-policy" element={<RefundPolicyPage />} />
            <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="reviews" element={<ReviewsPage />} />

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

          {/* Admin login (outside layout/protection) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Routes inside AdminLayout */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminAddProductPage />} />
            <Route path="products/:id" element={<AdminEditProductPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="offers" element={<AdminOffersPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="logout" element={<AdminLogoutPage />} />
          </Route>

          {/* Super Admin login */}
          <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

          {/* Super Admin Routes inside SuperAdminLayout */}
          <Route
            path="/superadmin"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdminLayout />
              </SuperAdminProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="admins" element={<SuperAdminDashboard />} />
            <Route path="admins/new" element={<CreateAdminPage />} />
            <Route path="products" element={<SuperAdminDashboard />} />
            <Route path="products/new" element={<SuperAdminAddProductPage />} />
            <Route path="products/:id" element={<SuperAdminEditProductPage />} />
            <Route path="orders" element={<SuperAdminOrdersPage />} />
            <Route path="logs" element={<SuperAdminDashboard />} />
            <Route path="customers" element={<SuperAdminDashboard />} />
            <Route path="pandl" element={<SuperAdminDashboard />} />
            <Route path="reviews" element={<SuperAdminDashboard />} />
            <Route path="logout" element={<SuperAdminLogoutPage />} />
          </Route>

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen text-xl font-bold">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRoutes;
