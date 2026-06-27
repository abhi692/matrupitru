// Country list for the phone country-code picker. Flags are generated from
// the ISO 3166-1 alpha-2 code instead of hand-typing ~100 emoji (each letter
// maps to a Unicode "regional indicator symbol" — that's what a flag emoji
// actually is under the hood).
export function flagEmoji(iso2) {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Ordered with India first (this app's primary market), then the countries
// where the Indian diaspora most commonly lives (NRI destinations), then the
// rest alphabetically — so the most relevant options are nearest the top.
export const COUNTRIES = [
  { name: 'India', iso2: 'IN', dialCode: '91' },
  { name: 'United States', iso2: 'US', dialCode: '1' },
  { name: 'United Arab Emirates', iso2: 'AE', dialCode: '971' },
  { name: 'United Kingdom', iso2: 'GB', dialCode: '44' },
  { name: 'Canada', iso2: 'CA', dialCode: '1' },
  { name: 'Australia', iso2: 'AU', dialCode: '61' },
  { name: 'Saudi Arabia', iso2: 'SA', dialCode: '966' },
  { name: 'Singapore', iso2: 'SG', dialCode: '65' },
  { name: 'Qatar', iso2: 'QA', dialCode: '974' },
  { name: 'Kuwait', iso2: 'KW', dialCode: '965' },
  { name: 'Oman', iso2: 'OM', dialCode: '968' },
  { name: 'Bahrain', iso2: 'BH', dialCode: '973' },
  { name: 'Germany', iso2: 'DE', dialCode: '49' },
  { name: 'New Zealand', iso2: 'NZ', dialCode: '64' },
  { name: 'Malaysia', iso2: 'MY', dialCode: '60' },
  { name: 'South Africa', iso2: 'ZA', dialCode: '27' },
  { name: 'Afghanistan', iso2: 'AF', dialCode: '93' },
  { name: 'Argentina', iso2: 'AR', dialCode: '54' },
  { name: 'Austria', iso2: 'AT', dialCode: '43' },
  { name: 'Bangladesh', iso2: 'BD', dialCode: '880' },
  { name: 'Belgium', iso2: 'BE', dialCode: '32' },
  { name: 'Bhutan', iso2: 'BT', dialCode: '975' },
  { name: 'Brazil', iso2: 'BR', dialCode: '55' },
  { name: 'Brunei', iso2: 'BN', dialCode: '673' },
  { name: 'Cambodia', iso2: 'KH', dialCode: '855' },
  { name: 'China', iso2: 'CN', dialCode: '86' },
  { name: 'Colombia', iso2: 'CO', dialCode: '57' },
  { name: 'Denmark', iso2: 'DK', dialCode: '45' },
  { name: 'Egypt', iso2: 'EG', dialCode: '20' },
  { name: 'Fiji', iso2: 'FJ', dialCode: '679' },
  { name: 'Finland', iso2: 'FI', dialCode: '358' },
  { name: 'France', iso2: 'FR', dialCode: '33' },
  { name: 'Greece', iso2: 'GR', dialCode: '30' },
  { name: 'Hong Kong', iso2: 'HK', dialCode: '852' },
  { name: 'Indonesia', iso2: 'ID', dialCode: '62' },
  { name: 'Iran', iso2: 'IR', dialCode: '98' },
  { name: 'Iraq', iso2: 'IQ', dialCode: '964' },
  { name: 'Ireland', iso2: 'IE', dialCode: '353' },
  { name: 'Israel', iso2: 'IL', dialCode: '972' },
  { name: 'Italy', iso2: 'IT', dialCode: '39' },
  { name: 'Japan', iso2: 'JP', dialCode: '81' },
  { name: 'Jordan', iso2: 'JO', dialCode: '962' },
  { name: 'Kenya', iso2: 'KE', dialCode: '254' },
  { name: 'Lebanon', iso2: 'LB', dialCode: '961' },
  { name: 'Maldives', iso2: 'MV', dialCode: '960' },
  { name: 'Mauritius', iso2: 'MU', dialCode: '230' },
  { name: 'Mexico', iso2: 'MX', dialCode: '52' },
  { name: 'Myanmar', iso2: 'MM', dialCode: '95' },
  { name: 'Nepal', iso2: 'NP', dialCode: '977' },
  { name: 'Netherlands', iso2: 'NL', dialCode: '31' },
  { name: 'Nigeria', iso2: 'NG', dialCode: '234' },
  { name: 'Norway', iso2: 'NO', dialCode: '47' },
  { name: 'Pakistan', iso2: 'PK', dialCode: '92' },
  { name: 'Philippines', iso2: 'PH', dialCode: '63' },
  { name: 'Poland', iso2: 'PL', dialCode: '48' },
  { name: 'Portugal', iso2: 'PT', dialCode: '351' },
  { name: 'Russia', iso2: 'RU', dialCode: '7' },
  { name: 'Sri Lanka', iso2: 'LK', dialCode: '94' },
  { name: 'South Korea', iso2: 'KR', dialCode: '82' },
  { name: 'Spain', iso2: 'ES', dialCode: '34' },
  { name: 'Sweden', iso2: 'SE', dialCode: '46' },
  { name: 'Switzerland', iso2: 'CH', dialCode: '41' },
  { name: 'Tanzania', iso2: 'TZ', dialCode: '255' },
  { name: 'Thailand', iso2: 'TH', dialCode: '66' },
  { name: 'Trinidad and Tobago', iso2: 'TT', dialCode: '1868' },
  { name: 'Turkey', iso2: 'TR', dialCode: '90' },
  { name: 'Uganda', iso2: 'UG', dialCode: '256' },
  { name: 'Ukraine', iso2: 'UA', dialCode: '380' },
  { name: 'Vietnam', iso2: 'VN', dialCode: '84' },
  { name: 'Zimbabwe', iso2: 'ZW', dialCode: '263' },
];

export function findCountryByDialCode(dialCode) {
  return COUNTRIES.find((c) => c.dialCode === dialCode);
}

export function findCountryByIso2(iso2) {
  return COUNTRIES.find((c) => c.iso2 === iso2);
}

export const DEFAULT_COUNTRY = findCountryByIso2('IN');

// Given a full E.164-ish string ("+971501234567"), find which known country's
// dial code it starts with — longest dial code first, since some are
// prefixes of others (e.g. "1" vs "1868").
export function matchCountryFromValue(value) {
  if (!value || !value.startsWith('+')) return null;
  const digits = value.slice(1);
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  return sorted.find((c) => digits.startsWith(c.dialCode)) || null;
}
