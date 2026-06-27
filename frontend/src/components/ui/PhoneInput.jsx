import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, matchCountryFromValue } from './countries';

function deriveDigits(value, country) {
  if (!value || !country) return '';
  const prefix = `+${country.dialCode}`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : '';
}

// Phone entry with a real country picker (flag + dial code), not just India —
// plenty of users are Indian but settled abroad (NRIs), or aren't Indian at
// all. Defaults to India since that's this app's primary market. `value`/
// `onChange` work with the full E.164 string ("+<dialCode><digits>").
export function PhoneInput({ value, onChange, className, id, ...props }) {
  const [country, setCountry] = useState(() => matchCountryFromValue(value) || DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const digits = deriveDigits(value, country);
  const filtered = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)
  );

  function handleDigitsChange(e) {
    const next = e.target.value.replace(/\D/g, '').slice(0, 14);
    onChange(next ? `+${country.dialCode}${next}` : '');
  }

  function selectCountry(c) {
    const currentDigits = deriveDigits(value, country);
    setCountry(c);
    setOpen(false);
    setSearch('');
    onChange(currentDigits ? `+${c.dialCode}${currentDigits}` : '');
  }

  return (
    <div ref={containerRef} className={cn('relative flex h-11 w-full items-stretch rounded-control border border-stone-200 bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-200 focus-within:border-brand-400', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 text-sm font-semibold text-stone-700 border-r border-stone-200 bg-stone-100 rounded-l-control hover:bg-stone-200/70 transition-colors"
      >
        <span className="text-base leading-none">{flagEmoji(country.iso2)}</span>
        +{country.dialCode}
        <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
      </button>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={digits}
        onChange={handleDigitsChange}
        placeholder="Phone number"
        className="flex-1 min-w-0 px-3.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none rounded-r-control"
        {...props}
      />

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 max-h-72 overflow-hidden rounded-control border border-stone-200 bg-white shadow-soft-lg flex flex-col">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country or code"
            className="m-2 rounded-control border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <div className="overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.iso2}
                type="button"
                onClick={() => selectCountry(c)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-brand-50',
                  c.iso2 === country.iso2 && 'bg-brand-50 text-brand-700 font-medium'
                )}
              >
                <span className="text-base leading-none">{flagEmoji(c.iso2)}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-stone-400">+{c.dialCode}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-4 text-sm text-stone-400 text-center">No match</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Generic-enough validation without full per-country numbering-plan rules:
// India gets its real rule (10 digits, starts 6-9); everything else just
// needs a recognized dial code and a plausible digit count.
export function isValidPhoneNumber(value) {
  const country = matchCountryFromValue(value);
  if (!country) return false;
  const digits = deriveDigits(value, country);
  if (country.iso2 === 'IN') return /^[6-9]\d{9}$/.test(digits);
  return digits.length >= 4 && digits.length <= 14;
}
