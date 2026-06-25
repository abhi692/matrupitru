// Static service catalog for Phase 1 (§5 GET /v1/catalog/services). Real vendor
// network / dynamic pricing is Phase 2.
export const SERVICE_CATALOG = [
  { id: 'doctor-visit', name: 'Doctor home visit', price: 800, currency: 'INR' },
  { id: 'physio', name: 'Physiotherapy session', price: 600, currency: 'INR' },
  { id: 'attendant-day', name: 'Day attendant (8hr)', price: 1200, currency: 'INR' },
  { id: 'diagnostics', name: 'Home diagnostics/lab draw', price: 500, currency: 'INR' },
  { id: 'medicines', name: 'Medicine delivery', price: 100, currency: 'INR' },
  { id: 'errand', name: 'Errand / grocery run', price: 200, currency: 'INR' },
];
