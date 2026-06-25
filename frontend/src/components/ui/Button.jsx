import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm focus-visible:ring-brand-300',
        outline: 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-brand-200',
        ghost: 'text-stone-600 hover:bg-stone-100',
        link: 'text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline p-0 h-auto',
        emergency: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-200',
        subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
