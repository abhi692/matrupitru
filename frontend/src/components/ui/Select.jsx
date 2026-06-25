import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-11 w-full appearance-none rounded-control border border-stone-200 bg-white px-3.5 pr-10 text-sm text-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
    </div>
  );
}
