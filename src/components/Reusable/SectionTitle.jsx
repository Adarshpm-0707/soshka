import React from 'react';

const SectionTitle = ({ title, subtitle, align = 'center', className = '', titleClassName = '' }) => {
  const alignment = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  };

  return (
    <div className={`flex flex-col mb-10 ${alignment[align]} ${className}`}>
      <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 ${titleClassName || 'font-sans'}`}>
        {title}
      </h2>
      <div className="h-1 w-12 bg-primary-600 rounded mt-3.5" />
      {subtitle && (
        <p className="mt-3 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
