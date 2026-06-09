-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========================================================
-- TABLES SETUP
-- ========================================================

-- 1. PROFILES Table (linked to Supabase Auth users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text,
    avatar_url text,
    phone text,
    address jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. PRODUCTS Table
create table public.products (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    description text,
    price numeric not null check (price >= 0),
    discount_price numeric check (discount_price >= 0 and discount_price <= price),
    stock integer default 0 check (stock >= 0),
    category text not null,
    images text[] not null default '{}'::text[],
    rating numeric default 0 check (rating >= 0 and rating <= 5),
    review_count integer default 0 check (review_count >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. CART ITEMS Table
create table public.cart_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    product_id uuid references public.products on delete cascade not null,
    quantity integer default 1 check (quantity > 0),
    unique(user_id, product_id)
);

-- 4. WISHLIST Table
create table public.wishlist (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    product_id uuid references public.products on delete cascade not null,
    unique(user_id, product_id)
);

-- 5. ORDERS Table
create table public.orders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    items jsonb not null, -- Array of items purchased (id, name, price, quantity, image)
    total numeric not null check (total >= 0),
    status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address jsonb not null,
    payment_id text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. REVIEWS Table
create table public.reviews (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    product_id uuid references public.products on delete cascade not null,
    rating numeric not null check (rating >= 1 and rating <= 5),
    comment text not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. CONTACT REQUESTS Table
create table public.contact_requests (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ========================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url, phone, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    '{}'::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync auth.users with public.profiles
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.contact_requests enable row level security;

-- 1. PROFILES Policies
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- 2. PRODUCTS Policies
create policy "Allow public read-only access to products"
    on public.products for select
    using (true);

create policy "Allow admins to insert/update/delete products"
    on public.products for all
    using (
        -- Simple check: if user is authenticated and is a special admin user
        -- For testing, we can check a field or email, or metadata
        auth.role() = 'authenticated' and (auth.jwt() ->> 'email') like '%admin%'
    );

-- 3. CART ITEMS Policies
create policy "Users can view their own cart items"
    on public.cart_items for select
    using (auth.uid() = user_id);

create policy "Users can insert their own cart items"
    on public.cart_items for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own cart items"
    on public.cart_items for update
    using (auth.uid() = user_id);

create policy "Users can delete their own cart items"
    on public.cart_items for delete
    using (auth.uid() = user_id);

-- 4. WISHLIST Policies
create policy "Users can view their own wishlist items"
    on public.wishlist for select
    using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items"
    on public.wishlist for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist items"
    on public.wishlist for delete
    using (auth.uid() = user_id);

-- 5. ORDERS Policies
create policy "Users can view their own orders"
    on public.orders for select
    using (auth.uid() = user_id);

create policy "Users can insert their own orders"
    on public.orders for insert
    with check (auth.uid() = user_id);

-- 6. REVIEWS Policies
create policy "Allow public read access to reviews"
    on public.reviews for select
    using (true);

create policy "Allow authenticated users to create reviews"
    on public.reviews for insert
    with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- 7. CONTACT REQUESTS Policies
create policy "Allow anyone to submit contact requests"
    on public.contact_requests for insert
    with check (true);
