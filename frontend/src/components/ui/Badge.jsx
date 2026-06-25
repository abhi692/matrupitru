import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      brand: 'bg-brand-50 text-brand-700',
      neutral: 'bg-stone-100 text-stone-600',
      warning: 'bg-warm-50 text-warm-600',
      danger: 'bg-rose-50 text-rose-600',
      success: 'bg-brand-50 text-brand-700',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
