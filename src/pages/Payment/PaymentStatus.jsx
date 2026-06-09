import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import Button from '../../components/Reusable/Button';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'success';
  const orderId = searchParams.get('orderId') || '';

  const isSuccess = status === 'success';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-850 p-8 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-lg text-center space-y-6">
        
        {/* Status Indicator Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 rounded-full">
              <CheckCircle2 size={56} />
            </div>
          ) : (
            <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-500 rounded-full">
              <XCircle size={56} />
            </div>
          )}
        </div>

        {/* Messaging details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold font-sans">
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            {isSuccess
              ? 'Your transaction was approved and your order is being processed.'
              : 'The transaction was rejected or aborted. Please check details and try again.'}
          </p>
        </div>

        {/* Order Reference */}
        {orderId && (
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-150 dark:border-slate-750/60">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Order ID Reference</span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-350">{orderId}</span>
          </div>
        )}

        {/* Action controls */}
        <div className="flex flex-col space-y-3 pt-2">
          {isSuccess ? (
            <>
              {orderId && (
                <Button onClick={() => navigate(`/orders/${orderId}`)} icon={ArrowRight}>
                  View Order Detail
                </Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/')}>
                Back to Shopping
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/checkout')} icon={RotateCcw}>
                Retry Checkout
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Cancel & Go Home
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
