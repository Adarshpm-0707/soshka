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

      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener('show-toast', handleToastEvent);
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500 h-5 w-5 flex-shrink-0" />,
    error: <AlertTriangle className="text-red-500 h-5 w-5 flex-shrink-0" />,
    info: <Info className="text-blue-500 h-5 w-5 flex-shrink-0" />
  };

  const borderColors = {
    success: 'border-l-emerald-500 dark:border-l-emerald-600',
    error: 'border-l-red-500 dark:border-l-red-600',
    info: 'border-l-blue-500 dark:border-l-blue-600'
  };

  return (
    <div className="fixed bottom-5 right-5 z-55 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start space-x-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border-l-4 ${borderColors[toast.type]} border border-slate-200 dark:border-slate-700/80`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {toast.message}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 transition"
            >
              <X size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
