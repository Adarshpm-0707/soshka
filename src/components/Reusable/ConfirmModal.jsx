import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, HelpCircle, X } from 'lucide-react';

/**
 * Reusable premium confirmation popup modal.
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Function to close modal
 * @param {function} onConfirm - Function to run on confirmation
 * @param {string} title - Title of the modal
 * @param {string} message - Warning message
 * @param {string} confirmLabel - Text for the confirm button
 * @param {string} cancelLabel - Text for the cancel button
 * @param {'danger' | 'warning' | 'info'} type - Type of modal style
 * @param {boolean} isLoading - Loading state for action
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  const themes = {
    danger: {
      icon: <AlertCircle className="h-6 w-6 text-rose-500" />,
      iconBg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-100 dark:border-rose-900/30',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 dark:shadow-rose-950/30'
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      iconBg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900/30',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100 dark:shadow-amber-950/30'
    },
    info: {
      icon: <HelpCircle className="h-6 w-6 text-sky-500" />,
      iconBg: 'bg-sky-50 dark:bg-sky-950/20',
      border: 'border-sky-100 dark:border-sky-900/30',
      btn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-100 dark:shadow-sky-950/30'
    }
  };

  const currentTheme = themes[type] || themes.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-y-auto no-print">
          {/* Backdrop blur & fade in */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full max-w-md bg-white dark:bg-slate-900 border ${currentTheme.border} rounded-3xl p-6 shadow-2xl space-y-6 text-slate-850 dark:text-white z-10 overflow-hidden font-sans-luxury`}
          >
            {/* Top Close Icon */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>

            {/* Icon & Message Block */}
            <div className="text-center space-y-3 pt-2">
              <div className={`mx-auto h-12 w-12 ${currentTheme.iconBg} rounded-full flex items-center justify-center`}>
                {currentTheme.icon}
              </div>
              <h3 className="text-lg font-black tracking-wider uppercase font-serif-luxury text-slate-850 dark:text-white">
                {title}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                {message}
              </p>
            </div>

            {/* Buttons grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 ${currentTheme.btn}`}
              >
                {isLoading ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{confirmLabel}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
