import React from 'react';

const Loader = ({ fullScreen, size = 'md', text }) => {
  const spinnerSizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-16 w-16 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-t-primary-600 border-r-transparent border-b-primary-600 border-l-transparent ${spinnerSizes[size]}`} />
      {text && <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton components for cards and text
export const SkeletonCard = () => (
  <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-96 flex flex-col justify-between p-4">
    <div className="bg-slate-200 dark:bg-slate-700 h-48 rounded-lg w-full mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mt-4" />
    </div>
    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full mt-4" />
  </div>
);

export const SkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-slate-200 dark:bg-slate-700 rounded" 
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      />
    ))}
  </div>
);

export default Loader;
