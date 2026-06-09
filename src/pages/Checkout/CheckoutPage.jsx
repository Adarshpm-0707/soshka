import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import AddressForm from './AddressForm';
import OrderSummary from '../Cart/OrderSummary';
import SectionTitle from '../../components/Reusable/SectionTitle';
import { formatCurrency } from '../../utils/formatCurrency';
import { ArrowLeft } from 'lucide-react';
import { showToast } from '../../components/Reusable/Toast';

const CheckoutPage = () => {
  const { cartItems, loading } = useCart();
  const navigate = useNavigate();

  // Redirect to cart if empty
  useEffect(() => {
    if (!loading && cartItems.length === 0) {
      showToast('Your cart is empty. Cannot checkout.', 'error');
      navigate('/cart');
    }
  }, [cartItems, loading, navigate]);

  const handleAddressSubmit = (shippingAddress) => {
    // Navigate to payment page and pass the address data along in the router state
    navigate('/payment', { state: { shippingAddress } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-905 transition-colors duration-300">
      
      {/* Back to Cart link button */}
      <button
        onClick={() => navigate('/cart')}
        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 hover:text-primary-600 transition mb-6"
      >
        <ArrowLeft size={14} />
        <span>Back to Cart</span>
      </button>

      {/* Required SectionTitle */}
      <SectionTitle
        title="Checkout Details"
        subtitle="Provide your delivery information and review your item summary before proceeding to payment."
        align="left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Shipping Address Inputs column */}
        <div className="lg:col-span-2">
          <AddressForm onSubmit={handleFilterChange => handleAddressSubmit(handleFilterChange)} />
        </div>

        {/* Order Preview side panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Custom Items Review Box */}
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 font-sans">
              Items Preview
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs font-semibold gap-3">
                  <div className="flex items-start space-x-2.5">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      x{item.quantity}
                    </span>
                    <span className="text-slate-700 dark:text-slate-350 line-clamp-2">{item.product?.name}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white flex-shrink-0">
                    {formatCurrency((item.product?.discount_price || item.product?.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <OrderSummary showCheckoutBtn={false} />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
