import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireOwnFamily } from '../../lib/auth.js';

export const aiRouter = Router();

const LANGUAGE_NAME = { en: 'English', hi: 'Hindi', kn: 'Kannada' };

// POST /v1/families/:id/digest — §10.1 "family update digest": an LLM turns raw
// visit logs, vitals, and notes into a warm weekly summary in the buyer's language.
// Phase 1 keeps AI minimal per the doc's own phasing, but this is the one piece
// built with a real model call rather than mocked — gated entirely on the buyer
// having ANTHROPIC_API_KEY configured; degrades to a clear 503 otherwise so the
// rest of the app never depends on it.
aiRouter.post(
  '/families/:id/digest',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'AI digest is not configured. Add ANTHROPIC_API_KEY to backend/.env to enable it.',
      });
    }

    const parents = await prisma.parent.findMany({
      where: { familyId: req.params.id },
      include: { user: true },
    });
    const parentIds = parents.map((p) => p.id);

    const [recentVisits, recentVitals, buyer] = await Promise.all([
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: 'completed' },
        orderBy: { checkOutAt: 'desc' },
        take: 5,
        include: { caregiver: true },
      }),
      prisma.vitalsReading.findMany({
        where: { parentId: { in: parentIds } },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }),
      prisma.user.findUnique({ where: { id: req.user.id } }),
    ]);

    if (recentVisits.length === 0) {
      return res.status(400).json({ error: 'No completed visits yet — nothing to summarize.' });
    }

    const visitLines = recentVisits
      .map((v) => {
        const checklist = JSON.parse(v.taskChecklistJson || '[]').filter((t) => t.done).map((t) => t.task).join(', ');
        return `- ${v.type} visit by ${v.caregiver?.name || 'caregiver'} on ${v.checkOutAt?.toISOString().slice(0, 10)}: ${checklist || 'no checklist notes'}. ${v.notes || ''}`;
      })
      .join('\n');

    const vitalsLines = recentVitals
      .map((vt) => `- ${vt.type}: ${vt.value} ${vt.unit} (${vt.flagged ? 'flagged out of range' : 'normal'}) on ${vt.recordedAt.toISOString().slice(0, 10)}`)
      .join('\n');

    const language = LANGUAGE_NAME[buyer.locale] || 'English';
    const parentName = parents[0]?.user.name || 'your parent';

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are writing a warm, reassuring weekly update for an NRI/relocated adult child about their elderly parent's care. Write in ${language}. Keep it to 3-4 short sentences, conversational, not clinical. Never give medical advice — only report what happened. If any vitals are flagged, mention it gently and say the Care Manager has been notified, without alarming language.

Parent: ${parentName}

Recent visits:
${visitLines}

Recent vitals:
${vitalsLines || 'No vitals recorded recently.'}`,
          },
        ],
      });

      const digest = message.content[0]?.text || '';
      res.json({ digest, generatedAt: new Date().toISOString(), language });
    } catch (err) {
      console.error('AI digest generation failed:', err.message);
      res.status(502).json({ error: 'AI digest generation failed. Please try again later.' });
    }
  }
);
