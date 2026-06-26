// Notification layer (§7 "redundant channels": push + SMS + WhatsApp + voice).
// SMS/WhatsApp/voice still log to console (no Twilio/Meta creds in Phase 1);
// push is real — looks up the recipient's Expo push token by phone and fires
// an actual Expo push notification if one's registered. Every caller goes
// through this module, so swapping in real SMS/WhatsApp later won't touch call sites.

import { prisma } from './db.js';
import { sendPushNotification } from './push.js';
import { sendWhatsAppMessage } from './whatsapp.js';

export async function notify(channel, to, message) {
  const ts = new Date().toISOString();

  if (channel === 'push') {
    const user = await prisma.user.findUnique({ where: { phone: to } });
    if (user?.pushToken) {
      const ticket = await sendPushNotification(user.pushToken, 'MatruPitru', message);
      console.log(`[notify:push] -> ${to} :: ${message} (${ts}) [expo: ${ticket.status}]`);
      return { channel, to, message, sentAt: ts, status: ticket.status === 'error' ? 'failed' : 'sent' };
    }
  }

  if (channel === 'whatsapp') {
    const result = await sendWhatsAppMessage(to, message);
    console.log(`[notify:whatsapp] -> ${to} :: ${message} (${ts}) [${result.status}]`);
    return { channel, to, message, sentAt: ts, status: result.status === 'failed' ? 'failed' : 'sent' };
  }

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
