import { prisma } from '../lib/db.js';
import { bus } from '../events/bus.js';
import { notify, notifyAll } from '../lib/notify.js';
import { logger } from '../lib/logger.js';
import { captureException } from '../lib/sentry.js';

// SOS escalation tree — §6.2 specifies a fallback layer beyond "notify the Care
// Manager and hope": if nobody acknowledges within ESCALATION_INTERVAL_MS, this
// automatically works down the parent's emergencyContacts list (level 1, 2, 3...)
// until someone acks or contacts run out, at which point it keeps re-alerting the
// Care Manager + buyers on a loop. No human has to remember to chase this up.

const TICK_MS = 30_000;
const ESCALATION_INTERVAL_MS = 2 * 60_000; // 2 minutes between escalation steps

async function escalateUnacknowledged() {
  const openSosAlerts = await prisma.alert.findMany({
    where: { type: 'sos', acknowledgedAt: null },
    include: { parent: { include: { user: true, family: { include: { users: true, carePlan: { include: { careManager: true } } } } } } },
  });

  for (const alert of openSosAlerts) {
    const lastTouch = alert.lastEscalatedAt || alert.triggeredAt;
    const dueForEscalation = Date.now() - new Date(lastTouch).getTime() > ESCALATION_INTERVAL_MS;
    if (!dueForEscalation) continue;

    const contacts = JSON.parse(alert.parent.emergencyContactsJson || '[]');
    const nextLevel = alert.escalationLevel + 1;
    const contact = contacts[nextLevel - 1];

    if (contact) {
      await notify('call', contact.phone, `URGENT: unacknowledged SOS for ${alert.parent.user.name}. You're listed as their emergency contact.`);
      await notifyAll(contact.phone, `URGENT: ${alert.parent.user.name} raised an SOS and it hasn't been acknowledged yet. Please check on them.`);
      await bus.emitEvent('sos.escalated', { alertId: alert.id, level: nextLevel, contact: contact.name });
    } else {
      // Out of emergency contacts — keep re-alerting Care Manager + buyers rather than going silent.
      const careManager = alert.parent.family.carePlan?.careManager;
      const buyers = alert.parent.family.users.filter((u) => u.role === 'buyer');
      if (careManager) await notify('call', careManager.phone, `REPEAT: unacknowledged SOS for ${alert.parent.user.name}`);
      for (const buyer of buyers) await notifyAll(buyer.phone, `Your parent's SOS is still unacknowledged. Please respond or call them directly.`);
      await bus.emitEvent('sos.escalated', { alertId: alert.id, level: nextLevel, contact: null });
    }

    await prisma.alert.update({
      where: { id: alert.id },
      data: { escalationLevel: nextLevel, lastEscalatedAt: new Date() },
    });
  }
}

async function tick() {
  try {
    await escalateUnacknowledged();
  } catch (err) {
    logger.error({ err }, 'escalation scheduler tick failed');
    captureException(err);
  }
}

export function startEscalationScheduler() {
  tick();
  return setInterval(tick, TICK_MS);
}
