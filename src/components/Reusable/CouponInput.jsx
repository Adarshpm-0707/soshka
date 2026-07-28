import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { couponService } from '../../services/couponService';
import { showToast } from './Toast';
import { Ticket, X, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const CouponInput = ({ onApply, onRemove, appliedCoupon }) => {
  const { user } = useAuth();
  const { cartItems, cartTotal } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApply = async (e) => {
    e?.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await couponService.validateCoupon(trimmedCode, cartTotal, user?.id, cartItems, user?.email);

      if (result.valid) {
        if (onApply) {
          onApply(result.coupon, result.discount);
        }
        showToast(`Coupon applied! You save ${formatCurrency(result.discount)}`, 'success');
        setCode('');
        setError(null);
      } else {
        setError(result.error || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setError(err.message || 'Failed to validate coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setCode('');
    setError(null);
    showToast('Coupon removed', 'info');
  };

  if (appliedCoupon) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Ticket size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-wider text-emerald-700 dark:text-emerald-300 uppercase">
                {appliedCoupon.code}
              </span>
              <Check size={14} className="text-emerald-500 stroke-[3]" />
            </div>
            <p className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80">
              Coupon applied successfully
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
          title="Remove Coupon"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            className="uppercase font-semibold tracking-wider text-xs"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !code.trim()}
          className="whitespace-nowrap px-4 text-xs font-black uppercase tracking-wider"
        >
          {loading ? (
            <span className="flex items-center space-x-1">
              <Loader2 size={14} className="animate-spin" />
              <span>Applying...</span>
            </span>
          ) : (
            'APPLY'
          )}
        </Button>
      </form>
      {error && (
        <p className="text-xs font-bold text-red-500 dark:text-red-400 px-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default CouponInput;
