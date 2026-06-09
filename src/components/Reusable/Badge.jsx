import React from 'react';
import { capitalize } from '../../utils/helpers';

const Badge = ({ status = 'pending', className = '' }) => {
  const normalizedStatus = status.toLowerCase();

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900/50'
  };

  const currentStyles = statusColors[normalizedStatus] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${currentStyles} ${className}`}>
      {capitalize(status)}
    </span>
  );
};

export default Badge;
