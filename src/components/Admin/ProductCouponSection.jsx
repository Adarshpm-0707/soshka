import React, { useState, useEffect } from 'react';
import { Ticket, Tag, Check, Info } from 'lucide-react';
import { couponService } from '../../services/couponService';

const ProductCouponSection = ({ selectedCouponIds = [], setSelectedCouponIds, disabled = false }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const data = await couponService.fetchAllCoupons();
        setCoupons(data || []);
      } catch (err) {
        console.error('Failed to load coupons in product section:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const handleToggleCoupon = (couponId) => {
    if (disabled) return;
    setSelectedCouponIds(prev => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.includes(couponId)) {
        return current.filter(id => id !== couponId);
      } else {
        return [...current, couponId];
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Applicable Coupons
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                Product Specific
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which coupon codes can be applied to this product.
            </p>
          </div>
        </div>
        {selectedCouponIds.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
            {selectedCouponIds.length} Selected
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
          Loading available coupons...
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center">
          <Info className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No active coupons found. You can create coupons in Admin &gt; Coupons.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {coupons.map((coupon) => {
            const isSelected = selectedCouponIds.includes(coupon.id);
            const discountLabel =
              coupon.type === 'percentage'
                ? `${coupon.value}% OFF`
                : `₹${coupon.value} FLAT OFF`;

            return (
              <div
                key={coupon.id}
                onClick={() => handleToggleCoupon(coupon.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500/80 shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                        {coupon.code}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {discountLabel}
                      </span>
                    </div>
                    {coupon.min_order_amount > 0 && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Min. order: ₹{coupon.min_order_amount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {!coupon.is_active ? (
                    <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">
                      {coupon.expires_at ? `Exp: ${new Date(coupon.expires_at).toLocaleDateString()}` : 'No Expiry'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductCouponSection;
