import { cn } from '../../lib/utils';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-control border border-stone-200 bg-white px-3.5 text-sm text-stone-800 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }) {
  return <label className={cn('block text-sm font-medium text-stone-600 mb-1.5', className)} {...props} />;
}
