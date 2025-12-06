import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-md h-[100dvh] sm:h-[850px] bg-slate-50 dark:bg-slate-900 flex flex-col sm:shadow-2xl sm:rounded-[2.5rem] overflow-hidden relative border-slate-200 dark:border-slate-800 sm:border-8 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};