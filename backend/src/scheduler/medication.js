import { prisma } from '../lib/db.js';
import { bus } from '../events/bus.js';
import { notifyAll } from '../lib/notify.js';

// The automation engine behind medication reminders. Nobody schedules a dose
// manually day-to-day: a buyer/Care Manager sets up a MedicationSchedule once
// ("Amlodipine, daily at 08:00 and 20:00"), and this loop does everything else —
// generates today's reminder, fires the alarm at the right time (parent app
// polls for "due" and rings/speaks it), and auto-escalates to a missed alert if
// nobody acknowledges within the grace period. No caregiver visit required.
//
// Simplification: HH:MM is interpreted in the server's local time, not the
// parent's stored timezone — fine for a single-region local deployment, but a
// production version should resolve this per-parent (e.g. via luxon) before
// going multi-region.

const TICK_MS = 30_000;

function todayAt(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

async function generateTodaysLogs() {
  const schedules = await prisma.medicationSchedule.findMany({ where: { active: true } });
  for (const schedule of schedules) {
    const times = JSON.parse(schedule.timesOfDayJson || '[]');
    for (const t of times) {
      const scheduledAt = todayAt(t);
      await prisma.medicationLog.upsert({
        where: { scheduleId_scheduledAt: { scheduleId: schedule.id, scheduledAt } },
        create: {
          parentId: schedule.parentId,
          scheduleId: schedule.id,
          medication: schedule.medication,
          scheduledAt,
          status: 'pending',
        },
        update: {},
      });
    }
  }
}

async function fireDueAlarms() {
  const due = await prisma.medicationLog.findMany({
    where: { status: 'pending', scheduledAt: { lte: new Date() } },
    include: { parent: { include: { user: true, family: { include: { users: true } } } } },
  });

  for (const log of due) {
    await prisma.medicationLog.update({ where: { id: log.id }, data: { status: 'due', firedAt: new Date() } });
    await bus.emitEvent('medication.due', { parentId: log.parentId, medication: log.medication, logId: log.id });

    // Ring the parent's device (the parent app polls for "due" and rings/speaks
    // it) and let the buyer know in parallel, same as a real push notification would.
    await notifyAll(log.parent.user.phone, `Reminder: time to take ${log.medication}`);
    const buyers = log.parent.family.users.filter((u) => u.role === 'buyer');
    for (const buyer of buyers) {
      await notifyAll(buyer.phone, `${log.parent.user.name}'s medication reminder (${log.medication}) just went off.`);
    }
  }
}

async function autoMissUnacknowledged() {
  const dueLogs = await prisma.medicationLog.findMany({
    where: { status: 'due' },
    include: { schedule: true },
  });

  for (const log of dueLogs) {
    const graceMinutes = log.schedule?.gracePeriodMinutes ?? 15;
    const overdue = Date.now() - new Date(log.firedAt).getTime() > graceMinutes * 60_000;
    if (!overdue) continue;

    await prisma.medicationLog.update({ where: { id: log.id }, data: { status: 'missed' } });
    await bus.emitEvent('medication.missed', { parentId: log.parentId, medication: log.medication, logId: log.id });
    await prisma.alert.create({ data: { parentId: log.parentId, severity: 'warning', type: 'med_missed' } });
  }
}

async function tick() {
  try {
    await generateTodaysLogs();
    await fireDueAlarms();
    await autoMissUnacknowledged();
  } catch (err) {
    console.error('[medication scheduler] tick failed:', err);
  }
}

export function startMedicationScheduler() {
  tick();
  return setInterval(tick, TICK_MS);
}
