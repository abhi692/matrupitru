// Stub notification layer (§7 "redundant channels": push + SMS + WhatsApp + voice).
// Phase 1 local build logs to console; swap for real providers (Twilio/Gupshup/etc.)
// without touching call sites — every caller goes through this module.

export async function notify(channel, to, message) {
  const ts = new Date().toISOString();
  console.log(`[notify:${channel}] -> ${to} :: ${message} (${ts})`);
  return { channel, to, message, sentAt: ts, status: 'sent' };
}

export async function notifyAll(to, message) {
  return Promise.all([
    notify('push', to, message),
    notify('sms', to, message),
    notify('whatsapp', to, message),
  ]);
}
