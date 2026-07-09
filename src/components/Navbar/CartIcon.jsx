import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartIcon = ({ className = "" }) => {
  const { cartCount } = useCart();

  return (
    <Link 
      to="/cart" 
      className={`relative p-2 flex items-center justify-center hover:scale-105 transition duration-200 ${className}`}
      aria-label={cartCount > 0 ? `Shopping Cart, ${cartCount} items` : 'Shopping Cart'}
    >
      <span className="sr-only">Shopping Cart</span>
      <ShoppingCart size={22} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-[#98183f] text-white text-[9px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-white/20 shadow-md animate-bounce leading-none" style={{ minWidth: '18px', height: '18px' }}>
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
