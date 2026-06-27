import { cn } from '../../lib/utils';

// India-only phone entry: the +91 country code is fixed and shown, the user
// only ever types the 10-digit mobile number. `value`/`onChange` work with
// the full E.164 string ("+91XXXXXXXXXX") so callers can treat this exactly
// like a normal phone field — no format conversion needed at the call site.
export function PhoneInput({ value, onChange, className, id, ...props }) {
  const digits = (value || '').replace(/^\+91/, '');

  function handleChange(e) {
    const next = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(next ? `+91${next}` : '');
  }

  return (
    <div
      className={cn(
        'flex h-11 w-full items-stretch rounded-control border border-stone-200 bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-200 focus-within:border-brand-400',
        className
      )}
    >
      <span className="flex items-center gap-1.5 px-3 text-sm font-semibold text-stone-700 border-r border-stone-200 bg-stone-100 rounded-l-control select-none">
        <span className="text-base leading-none">🇮🇳</span>
        +91
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        value={digits}
        onChange={handleChange}
        placeholder="9900000000"
        className="flex-1 min-w-0 px-3.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none rounded-r-control"
        {...props}
      />
    </div>
  );
}

export function isValidIndianPhone(value) {
  return /^\+91[6-9]\d{9}$/.test(value || '');
}
