import { EventEmitter } from 'node:events';
import { prisma } from '../lib/db.js';

// Lightweight in-process event bus per System Design §3 ("modular monolith first").
// Every emit is persisted to the Event table for audit/replay, then fanned out
// in-process to subscribers (notifications, quality checks, dashboards).
class Bus extends EventEmitter {
  async emitEvent(type, payload) {
    await prisma.event.create({
      data: { type, payloadJson: JSON.stringify(payload) },
    });
    this.emit(type, payload);
  }
}

export const bus = new Bus();
