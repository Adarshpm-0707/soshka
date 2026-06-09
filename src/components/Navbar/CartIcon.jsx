import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartIcon = ({ className = "" }) => {
  const { cartCount } = useCart();

  return (
    <Link to="/cart" className={`relative p-2 flex items-center justify-center hover:scale-105 transition duration-200 ${className}`}>
      <ShoppingCart size={22} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-white text-brand text-[9px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-brand/50 shadow-md animate-bounce leading-none" style={{ minWidth: '18px', height: '18px' }}>
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
