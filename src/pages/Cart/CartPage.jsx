import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import CartItem from './CartItem';
import OrderSummary from './OrderSummary';
import SectionTitle from '../../components/Reusable/SectionTitle';
import Loader from '../../components/Reusable/Loader';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const CartPage = () => {
  const { cartItems, loading } = useCart();

  if (loading && cartItems.length === 0) {
    return <Loader fullScreen text="Loading shopping cart..." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-black transition-colors duration-300">
      {/* Required SectionTitle */}
      <SectionTitle
        title="Your Shopping Cart"
        subtitle="Review your selection, adjust quantities, and proceed to checkout when ready."
        align="left"
      />

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full mb-4">
            <ShoppingBag size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-850 dark:text-white mb-2 font-sans">
            Your cart is empty
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm">
            Looks like you haven't added anything to your cart yet. Head back to the store to find some amazing products!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl shadow hover:bg-primary-750 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Cart Calculations Summary panel */}
          <div className="lg:col-span-1">
            <OrderSummary showCheckoutBtn={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
