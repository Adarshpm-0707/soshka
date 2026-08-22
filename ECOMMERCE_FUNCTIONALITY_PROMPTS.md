# E-Commerce Web Application - Full Functional Prompts & Implementation Guide

> **Note**: This document provides a complete, step-by-step set of prompts designed to replicate the exact database, API endpoints, backend edge functions, state management, business logic, and page capabilities of this e-commerce project on **any new project**, focusing strictly on **functionality, APIs, data saving, and workflows**, while leaving styling, visual themes, and assets customizable.

---

## 📋 Table of Contents
1. [Architecture & Stack Requirements](#1-architecture--stack-requirements)
2. [Prompt 1: Database Schema, SQL Functions & RLS Security](#prompt-1-database-schema-sql-functions--rls-security)
3. [Prompt 2: Supabase Edge Functions (Serverless APIs & Payment/Shipping Integrations)](#prompt-2-supabase-edge-functions-serverless-apis--paymentshipping-integrations)
4. [Prompt 3: Core Services & Data Access Layer (API Clients)](#prompt-3-core-services--data-access-layer-api-clients)
5. [Prompt 4: Global React State Context Providers](#prompt-4-global-react-state-context-providers)
6. [Prompt 5: Access Control & Route Guarding (RBAC)](#prompt-5-access-control--route-guarding-rbac)
7. [Prompt 6: Customer-Facing Functional Pages Logic](#prompt-6-customer-facing-functional-pages-logic)
8. [Prompt 7: Admin & SuperAdmin Functional Management Pages](#prompt-7-admin--superadmin-functional-management-pages)

---

## 1. Architecture & Stack Requirements

- **Frontend Core**: React 18+ (Vite), React Router DOM (v6+), Context API.
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Row-Level Security, Storage Buckets).
- **Serverless API**: Supabase Edge Functions (Deno / TypeScript).
- **Integrations**:
  - **Payment Gateways**: Razorpay (Prepaid cryptographic signature validation) & Cash-On-Delivery (COD).
  - **Logistics / Shipping**: Shiprocket API (Automatic order push, tracking ID generation, pincode serviceability / ETA).
  - **Transactional Email**: Resend / SMTP for order confirmations & contact inquiries.
- **User Roles**: `user` (Customer), `admin` (Store Manager), `superadmin` (System Owner).

---

## PROMPT 1: Database Schema, SQL Functions & RLS Security

```markdown
Act as a Principal Database Architect. Generate the complete PostgreSQL database setup script for a multi-role E-Commerce web application in Supabase. The script must include table creation, constraints, triggers, SQL helper functions, and strict Row Level Security (RLS) policies.

### Required Tables & Schemas:

1. `profiles`:
   - `id`: UUID (Primary Key, references `auth.users` on delete cascade)
   - `name`: TEXT
   - `email`: TEXT
   - `avatar_url`: TEXT
   - `phone`: TEXT
   - `address`: JSONB default '{}'
   - `role`: TEXT default 'user' (CHECK constraint: 'user', 'admin', 'superadmin')
   - `is_active`: BOOLEAN default true
   - `created_by`: UUID (references `auth.users`)
   - `updated_at`: TIMESTAMPTZ default now()

2. `categories`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `name`: TEXT NOT NULL
   - `slug`: TEXT NOT NULL UNIQUE
   - `created_at`: TIMESTAMPTZ default now()

3. `offers`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `title`: TEXT NOT NULL
   - `message`: TEXT
   - `discount_percent`: INT CHECK (0 to 100)
   - `is_active`: BOOLEAN default false
   - `start_date`: TIMESTAMPTZ, `end_date`: TIMESTAMPTZ
   - `created_at`: TIMESTAMPTZ default now()

4. `products`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `name`: TEXT NOT NULL, `slug`: TEXT NOT NULL UNIQUE
   - `description`: TEXT
   - `price`: NUMERIC NOT NULL CHECK >= 0
   - `discount_price`: NUMERIC CHECK >= 0
   - `original_price`: NUMERIC
   - `offer_price`: NUMERIC
   - `stock`: INT default 0 CHECK >= 0
   - `category`: TEXT NOT NULL
   - `category_id`: UUID references `categories(id)` ON DELETE SET NULL
   - `offer_id`: UUID references `offers(id)` ON DELETE SET NULL
   - `images`: TEXT[] NOT NULL default '{}'
   - `rating`: NUMERIC default 0, `review_count`: INT default 0
   - `cost`: NUMERIC default 0
   - `created_at`: TIMESTAMPTZ default now()

5. `cart_items`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `user_id`: UUID references `auth.users` ON DELETE CASCADE NOT NULL
   - `product_id`: UUID references `products(id)` ON DELETE CASCADE NOT NULL
   - `quantity`: INT default 1 CHECK > 0
   - UNIQUE constraint on (`user_id`, `product_id`)

6. `wishlist`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `user_id`: UUID references `auth.users` ON DELETE CASCADE NOT NULL
   - `product_id`: UUID references `products(id)` ON DELETE CASCADE NOT NULL
   - UNIQUE constraint on (`user_id`, `product_id`)

7. `coupons` & `coupon_usage`:
   - `coupons`: `id`, `code` (UNIQUE), `type` ('percentage' | 'flat'), `value`, `min_order_amount`, `max_uses`, `used_count`, `is_active`, `expires_at`, `created_by`.
   - `coupon_usage`: `id`, `coupon_id`, `user_id`, `order_id`, `used_at`, UNIQUE(`coupon_id`, `user_id`).

8. `orders`:
   - `id`: UUID PRIMARY KEY default gen_random_uuid()
   - `user_id`: UUID references `auth.users` ON DELETE CASCADE (nullable for guest)
   - `items`: JSONB NOT NULL (Array of items: product_id, name, price, quantity, size, image)
   - `subtotal`: NUMERIC, `shipping_fee`: NUMERIC, `discount_amount`: NUMERIC default 0, `cod_fee`: NUMERIC default 0, `total`: NUMERIC NOT NULL
   - `payment_method`: TEXT default 'prepaid' CHECK ('prepaid', 'cod')
   - `status`: TEXT default 'pending' CHECK ('pending', 'paid', 'confirmed', 'failed', 'processing', 'shipped', 'delivered', 'cancelled')
   - `shipping_address`: JSONB NOT NULL
   - `coupon_id`: UUID references `coupons(id)`
   - `razorpay_order_id`: TEXT, `razorpay_payment_id`: TEXT, `razorpay_signature`: TEXT
   - `shiprocket_order_id`: TEXT, `shiprocket_shipment_id`: TEXT
   - `created_at`: TIMESTAMPTZ default now(), `updated_at`: TIMESTAMPTZ default now()

9. `reviews` & `store_reviews`:
   - `reviews`: Product reviews linked to `product_id` and `user_id` (rating 1-5, comment).
   - `store_reviews`: Site-wide testimonials (`name`, `location`, `rating`, `comment`, `image_url`, `platform`).

10. `admin_logs` & `payment_settings`:
   - `admin_logs`: `id`, `actor_id` (references `auth.users`), `action`, `target_table`, `target_id`, `details` JSONB, `created_at`.
   - `payment_settings`: `id`, `gateway` default 'razorpay', `api_key`, `api_secret`, `is_active`, `updated_by`, `updated_at`.

11. `contact_requests`:
   - `id`, `name`, `email`, `message`, `created_at`.

### Triggers & Database Functions:
1. `handle_new_user()` Trigger Function:
   - Triggers `AFTER INSERT ON auth.users`.
   - Extracts `name`, `phone`, `avatar_url`, and `role` from `raw_user_meta_data`.
   - Inserts row into `public.profiles` automatically, handling role fallbacks.
2. `public.is_admin()` Security Definer Function:
   - Returns boolean checking if `auth.uid()` has `role IN ('admin', 'superadmin')` and `is_active = true` in `profiles`.

### Row Level Security Policies (RLS):
- Enable RLS on all tables.
- `profiles`: Users view/update own profile. Admins view/update/insert/delete all profiles.
- `products`, `categories`, `offers`, `reviews`, `store_reviews`: Public SELECT access. Admin ALL access.
- `cart_items`, `wishlist`, `orders`: User-owned access. Admins read/update all orders.
- `coupons`: Authenticated SELECT for active coupons; Admin ALL management.
- `admin_logs` & `payment_settings`: Admin only access.
- `storage.buckets`: Create public bucket `products` with public read policies and admin write policies.
```

---

## PROMPT 2: Supabase Edge Functions (Serverless APIs & Payment/Shipping Integrations)

```markdown
Act as a Senior Backend & Serverless Engineer. Create the complete suite of TypeScript Deno Supabase Edge Functions for handling payment processing, order placement, stock management, logistics integration, and notifications.

### Required Edge Functions:

1. `create-razorpay-order`:
   - **Purpose**: Creates an order on Razorpay server-side with strict server price recalculation.
   - **Payload**: `{ items: Array<{product_id, qty, size}>, shipping_address: Object }`
   - **Logic**:
     1. Authenticate requesting user context.
     2. Query DB to fetch authoritative prices (`original_price` or `offer_price`) and verify stock availability for each item.
     3. Calculate `subtotal`, `shipping_fee`, and `total`. Convert total to paise.
     4. Make POST request to `https://api.razorpay.com/v1/orders` using `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
     5. Insert initial row into `public.orders` with `status: 'pending'` and `razorpay_order_id`.
     6. Return `{ order_id, amount, key_id, db_order_id }`.

2. `verify-razorpay-payment`:
   - **Purpose**: Validates cryptographic signature after Razorpay payment and confirms order.
   - **Payload**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id, coupon_id, user_id }`
   - **Logic**:
     1. Compute expected HMAC-SHA256 signature using `razorpay_order_id + "|" + razorpay_payment_id` with `RAZORPAY_KEY_SECRET`.
     2. If signature matches:
        - Update DB order status to `'paid'`, record payment IDs.
        - Decrement product stock in `products` table for all items in order.
        - Record coupon usage in `coupon_usage` table if a coupon was applied.
        - Optionally trigger background call to `create-shiprocket-order` and `send-order-email`.
     3. Return `{ success: true, order_id }`.

3. `create-cod-order`:
   - **Purpose**: Processes Cash-On-Delivery orders securely.
   - **Payload**: `{ items, shipping_address, coupon_id, discount_amount, cod_fee }`
   - **Logic**:
     1. Validate user and recalculate prices and stock server-side.
     2. Calculate total amount including `cod_fee` minus `discount_amount`.
     3. Insert row into `public.orders` with `payment_method: 'cod'`, `status: 'confirmed'`.
     4. Decrement product stock immediately.
     5. Record coupon usage in `coupon_usage`.
     6. Trigger Shiprocket shipment creation and email confirmation.

4. `create-shiprocket-order`:
   - **Purpose**: Integrates with Shiprocket Logistics API to auto-generate shipping orders.
   - **Logic**:
     1. Authenticate with Shiprocket API (`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`) to retrieve auth token.
     2. Format order payload with pickup location, customer address, line items, and payment status.
     3. Call Shiprocket `/orders/create/adhoc` endpoint.
     4. Save `shiprocket_order_id` and tracking metadata back to `public.orders`.

5. `check-shiprocket-eta`:
   - **Purpose**: Checks pincode serviceability and delivery timeline.
   - **Payload**: `{ delivery_postcode }`
   - **Return**: `{ serviceable: boolean, courier_name, etd, rate }`.

6. `cancel-order`:
   - **Purpose**: Handles order cancellation logic for users or admins.
   - **Logic**:
     1. Verify order belongs to user or request is from Admin.
     2. Verify order status is `pending`, `paid`, or `confirmed` (not shipped).
     3. Re-increment product stock in `products` table.
     4. Update order status to `'cancelled'`.
     5. If Shiprocket order exists, trigger Shiprocket cancel endpoint.

7. `send-order-email` & `send-contact-email`:
   - **Purpose**: Sends HTML formatted emails for order confirmations and customer messages via Resend or SMTP API.
```

---

## PROMPT 3: Core Services & Data Access Layer (API Clients)

```markdown
Act as a Frontend System Architect. Write modular JavaScript service modules (using `@supabase/supabase-js`) that encapsulate all database queries, edge function calls, image uploads, and business logic.

### Required Service Modules:

1. `authService.js`:
   - `signUp({ email, password, name, phone, role })`: Calls `supabase.auth.signUp()` with metadata.
   - `signIn({ email, password })`: Authenticates user.
   - `signOut()`: Logs out current session.
   - `getCurrentProfile()`: Fetches current profile with role from `profiles` table.
   - `updateProfile(userId, updates)`: Updates user profile info.

2. `productService.js`:
   - `getProducts({ category, search, minPrice, maxPrice, sortBy, page, limit })`: Returns paginated products with total count.
   - `getProductBySlug(slug)` / `getProductById(id)`: Fetches single product details.
   - `createProduct(productData)`: Inserts product (Admin).
   - `updateProduct(id, updates)`: Updates product (Admin).
   - `deleteProduct(id)`: Deletes product (Admin).
   - `uploadProductImage(file)`: Uploads file to Supabase `products` storage bucket and returns public URL.

3. `cartService.js`:
   - `getCart(userId)`: Fetches user's cart items with full product details joined.
   - `addToCart(userId, productId, quantity)`: Inserts or updates quantity.
   - `updateQuantity(cartItemId, quantity)`: Modifies quantity.
   - `removeFromCart(cartItemId)`: Deletes item.
   - `clearCart(userId)`: Removes all user items.

4. `wishlistService.js`:
   - `getWishlist(userId)`: Fetches wishlist items with product details.
   - `toggleWishlist(userId, productId)`: Adds if missing, deletes if exists.

5. `checkoutService.js`:
   - `createRazorpayOrder(items, shippingAddress)`: Calls `create-razorpay-order` edge function.
   - `verifyRazorpayPayment(paymentData)`: Calls `verify-razorpay-payment` edge function.
   - `createCodOrder(orderData)`: Calls `create-cod-order` edge function.
   - `checkDeliveryEta(pincode)`: Calls `check-shiprocket-eta` edge function.

6. `orderService.js`:
   - `getUserOrders(userId)`: Fetches user's past orders sorted by date.
   - `getAllOrders({ status, page, limit })`: Admin order list with filters.
   - `updateOrderStatus(orderId, status, trackingId)`: Admin status update.
   - `cancelOrder(orderId)`: Triggers order cancellation.

7. `couponService.js`:
   - `getAllCoupons()`: Admin coupon listing.
   - `createCoupon(couponData)`: Creates coupon.
   - `validateCoupon(code, cartTotal, userId)`: Validates active status, expiry, min cart amount, max uses, and checks `coupon_usage` table to enforce single-use per user. Calculates discount value.

8. `adminLogService.js` & `superadminService.js`:
   - `logAction(action, targetTable, targetId, details)`: Logs admin activity to `admin_logs`.
   - `getAllAdmins()`, `createAdminUser(data)`, `toggleAdminStatus(id, isActive)`: Superadmin management.
   - `getPaymentSettings()`, `updatePaymentSettings(data)`: Gateway credential configuration.
```

---

## PROMPT 4: Global React State Context Providers

```markdown
Act as a React State Lead. Build three comprehensive React Context Providers with custom hooks: `AuthContext`, `CartContext`, and `WishlistContext`.

### 1. `AuthContext.jsx` (`useAuth` hook):
- **State**: `user`, `profile`, `role` ('user' | 'admin' | 'superadmin'), `loading`, `isAuthenticated`.
- **Functions**: `login(email, password)`, `register(data)`, `logout()`, `refreshProfile()`.
- **Behavior**: Listens to `supabase.auth.onAuthStateChange()`, automatically loads user profile from `profiles` table on session start, clears state on logout.

### 2. `CartContext.jsx` (`useCart` hook):
- **State**: `cartItems`, `cartCount`, `subtotal`, `discount`, `shippingFee`, `totalAmount`, `appliedCoupon`, `loading`.
- **Functions**:
  - `addToCart(product, quantity)`
  - `updateQuantity(cartItemId, quantity)`
  - `removeFromCart(cartItemId)`
  - `clearCart()`
  - `applyCoupon(code)`
  - `removeCoupon()`
- **Behavior**: Persists cart in Supabase `cart_items` for logged-in users and in `localStorage` for guests. Re-calculates totals dynamically whenever items or coupons change.

### 3. `WishlistContext.jsx` (`useWishlist` hook):
- **State**: `wishlistItems`, `wishlistCount`, `loading`.
- **Functions**: `toggleWishlist(product)`, `isInWishlist(productId)`, `removeFromWishlist(productId)`.
- **Behavior**: Syncs state with Supabase `wishlist` table.
```

---

## PROMPT 5: Access Control & Route Guarding (RBAC)

```markdown
Act as a Frontend Security Developer. Create reusable React Router (v6+) private route guard components to implement Role-Based Access Control (RBAC).

### Required Route Guards:

1. `ProtectedRoute.jsx`:
   - Wraps routes accessible only to authenticated users (e.g. `/profile`, `/orders`, `/checkout`).
   - If loading, render loading spinner.
   - If unauthenticated, redirect to `/login` with `from` location saved in state.

2. `AdminRoute.jsx`:
   - Wraps routes accessible to `admin` AND `superadmin` roles.
   - Checks `profile.role === 'admin' || profile.role === 'superadmin'`.
   - If non-admin user attempts access, redirect to unauthorized / home page with an alert message.

3. `SuperAdminRoute.jsx`:
   - Wraps routes accessible EXCLUSIVELY to `superadmin` role (e.g. `/superadmin/manage-admins`, `/superadmin/payment-settings`, `/superadmin/logs`).
   - Checks `profile.role === 'superadmin'`.
   - Denies access to regular admins and users.
```

---

## PROMPT 6: Customer-Facing Functional Pages Logic

```markdown
Act as a Senior Frontend React Developer. Create the functional component pages for the customer-facing e-commerce storefront. Implement full state handling, form validation, service API calls, and error/loading states. (Focus purely on JavaScript code, state, and event handling without hardcoding CSS themes).

### Required Pages & Logical Implementations:

1. **Home Page (`src/pages/Home/`)**:
   - Fetch featured products from `productService.getProducts()`.
   - Fetch active store offers/banners from `offerService`.
   - Display category quick links and store testimonials from `storeReviewService`.

2. **Products Listing Page (`src/pages/Products/`)**:
   - Filter state: search query, category, price range (`minPrice`, `maxPrice`), sorting (`price-asc`, `price-desc`, `newest`), stock availability.
   - Dynamic URL query sync (`?category=shoes&sort=newest`).
   - Server-side or client-side pagination.
   - Quick Add-to-Cart and Wishlist toggle buttons for each product card.

3. **Product Details Page (`src/pages/ProductDetails/`)**:
   - Dynamic route `:slug` or `:id`.
   - Image thumbnail switcher state.
   - Variant / Size selection state.
   - Stock counter & out-of-stock badge.
   - Add to Cart with selected quantity & size.
   - Customer Reviews section: Fetch product reviews, display average rating breakdown, submission form for authenticated users who purchased the product.
   - Related products recommendation list.

4. **Cart Page (`src/pages/Cart/`)**:
   - Displays line items with image, name, unit price, quantity controls (`+` / `-`), item total, and delete button.
   - Coupon code input box: calls `couponService.validateCoupon()`, displays error message or applied discount value.
   - Summary breakdown: Subtotal, Coupon Discount, Estimated Shipping, Order Total.
   - "Proceed to Checkout" action button.

5. **Checkout Page (`src/pages/Checkout/`)**:
   - Shipping Address Form: Name, Email, Phone, Street Address, City, State, Pincode. Pre-fill from `user.profile.address`.
   - Pincode Serviceability Check: Automatically trigger `checkoutService.checkDeliveryEta(pincode)` on 6-digit pincode entry to show estimated delivery days.
   - Payment Method Selector: Radio choices for **Prepaid (Razorpay)** vs **Cash on Delivery (COD)**.
   - Calculate COD extra fee if COD selected.
   - Order submission handler:
     - If COD: Call `checkoutService.createCodOrder()`, clear cart, redirect to Order Success page.
     - If Prepaid: Call `checkoutService.createRazorpayOrder()`, open Razorpay checkout modal using `window.Razorpay()`. On success callback, call `checkoutService.verifyRazorpayPayment()`, clear cart, and redirect to Order Success page.

6. **Orders History & Order Details Page (`src/pages/Orders/`)**:
   - User orders listing with status badges (`pending`, `confirmed`, `paid`, `shipped`, `delivered`, `cancelled`).
   - Order detail view: Line items, payment method, delivery tracking link (Shiprocket tracking ID), price breakdown, shipping address.
   - "Cancel Order" button (enabled only if status is cancelable).

7. **Wishlist Page (`src/pages/Wishlist/`)**:
   - Grid of saved products.
   - "Move to Cart" button (adds item to cart and removes from wishlist).

8. **Profile Page (`src/pages/Profile/`)**:
   - Edit personal profile details (Name, Phone, Address).
   - Saved shipping addresses management.
   - Account security (change password).

9. **Auth Pages (`Login.jsx`, `Register.jsx`)**:
   - Form inputs with email/password validation.
   - Handle login/signup error states (e.g. invalid credentials, user already exists).
   - Auto redirect upon successful authentication based on user role (`/` for users, `/admin` for admins, `/superadmin` for superadmins).
```

---

## PROMPT 7: Admin & SuperAdmin Functional Management Pages

```markdown
Act as an Enterprise Admin Dashboard Developer. Create the functional logic for Admin and SuperAdmin back-office management pages. Ensure all CRUD operations update Supabase database tables and log audit entries in `admin_logs`.

### Required Admin Pages & Logic:

1. **Admin Dashboard (`src/pages/Admin/AdminDashboard.jsx`)**:
   - Metrics cards: Total Sales Revenue, Total Orders Count, Total Products Count, Active Customers Count.
   - Sales chart data aggregation (revenue by day/month).
   - Recent orders table with quick view and status dropdown.

2. **Admin Products Management (`AdminProductsPage.jsx`, `AdminAddProductPage.jsx`, `AdminEditProductPage.jsx`)**:
   - Products table with search, category filter, stock status, edit/delete actions.
   - Product Add/Edit Form: Name, Slug (auto-generated from name), Description, Category, Price, Discount Price, Cost, Stock, Images upload handler (multi-file upload to Supabase `products` storage bucket).
   - Save handler: Validates data, inserts/updates `products` table, logs action to `admin_logs`.

3. **Admin Orders Management (`AdminOrdersPage.jsx`)**:
   - Orders list with status filter tabs (All, Pending, Confirmed, Processing, Shipped, Delivered, Cancelled).
   - Order Status Updater modal: Change status, enter courier name & tracking ID (updates `shiprocket_order_id` or custom tracking), sends notification email to customer.

4. **Categories, Coupons & Offers Management (`AdminCategoriesPage`, `AdminCouponsPage`, `AdminOffersPage`)**:
   - Full CRUD tables with modal forms.
   - Coupons form: Code, Type (percentage/flat), Value, Min Order Amount, Max Uses limit, Expiry Date, Active toggle.

5. **SuperAdmin Dashboard & Control Center (`src/pages/SuperAdmin/`)**:
   - `ManageAdminsPage.jsx`: List all system admins, form to create new Admin user (`signUp` with metadata `role: 'admin'`), toggle active/inactive account status.
   - `PaymentSettingsPage.jsx`: View & update Razorpay API Key ID and API Secret credentials stored securely in `payment_settings` table.
   - `ActivityLogsPage.jsx`: Audit log viewer for `admin_logs` showing timestamp, actor name/email, action type, target table, and detailed JSON diffs.
```

---

## 🎯 How to Use These Prompts

1. **Database First**: Run **Prompt 1** in your Supabase SQL Editor.
2. **Serverless APIs**: Execute **Prompt 2** to deploy your Supabase Edge Functions.
3. **Core Services**: Use **Prompt 3** to build your API interaction layer.
4. **State Management**: Apply **Prompt 4** & **Prompt 5** for React context and security route guards.
5. **UI Pages**: Feed **Prompt 6** and **Prompt 7** to your UI generator or coding assistant to build fully-functional pages styled according to your new project's design system.
