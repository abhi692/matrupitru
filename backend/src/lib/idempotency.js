// Idempotency-Key support per design doc §5 ("idempotency keys on all POST that
// create money/visits"). Replaying the same key returns the original record
// instead of creating a duplicate visit/booking/payment/subscription.
export function getIdempotencyKey(req) {
  return req.headers['idempotency-key'] || undefined;
}

export async function findByIdempotencyKey(model, key) {
  if (!key) return null;
  return model.findUnique({ where: { idempotencyKey: key } });
}
