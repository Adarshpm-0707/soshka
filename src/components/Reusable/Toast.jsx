import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Trigger a toast notification from anywhere in the app.
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'info'} type - Type of toast
 */
export const showToast = (message, type = 'success') => {
  const event = new CustomEvent('show-toast', {
    detail: { message, type, id: Date.now() }
  });
  window.dispatchEvent(event);
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const newToast = e.detail;
      setToasts((prevToasts) => [...prevToasts, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleToastEvent);
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500 dark:text-emerald-400 h-5 w-5 flex-shrink-0" />,
    error: <AlertTriangle className="text-rose-500 dark:text-rose-450 h-5 w-5 flex-shrink-0" />,
    info: <Info className="text-sky-500 dark:text-sky-400 h-5 w-5 flex-shrink-0" />
  };

  const glows = {
    success: 'shadow-emerald-500/10 dark:shadow-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30',
    error: 'shadow-rose-500/10 dark:shadow-rose-500/20 border-rose-500/20 dark:border-rose-500/30',
    info: 'shadow-sky-500/10 dark:shadow-sky-500/20 border-sky-500/20 dark:border-sky-500/30'
  };

  const bgGradients = {
    success: 'from-emerald-50/50 to-transparent dark:from-emerald-950/10 dark:to-transparent',
    error: 'from-rose-50/50 to-transparent dark:from-rose-950/10 dark:to-transparent',
    info: 'from-sky-50/50 to-transparent dark:from-sky-950/10 dark:to-transparent'
  };

  const progressColors = {
    success: 'bg-emerald-500 dark:bg-emerald-400',
    error: 'bg-rose-500 dark:bg-rose-450',
    info: 'bg-sky-500 dark:bg-sky-400'
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, x: 30, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto relative flex items-start space-x-3 p-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border ${glows[toast.type]} bg-gradient-to-r ${bgGradients[toast.type]} overflow-hidden`}
          >
            {/* Left accent column with icon */}
            <div className="mt-0.5">{icons[toast.type]}</div>

            {/* Message Body */}
            <div className="flex-1 text-xs sm:text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100 leading-relaxed pr-2">
              {toast.message}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-lg transition"
            >
              <X size={14} />
            </button>

            {/* Animated Bottom Timer Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50 dark:bg-slate-800/40">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`h-full ${progressColors[toast.type]}`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
