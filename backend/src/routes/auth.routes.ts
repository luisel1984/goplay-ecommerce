import { Router } from 'express';
import { z } from 'zod';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  marketingOptIn: z.boolean().optional(),
  rgpdAccepted: z.literal(true), // RGPD obligatorio
  locale: z.enum(['fr', 'en']).default('fr'),
});

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new HttpError(409, 'Cet email est déjà utilisé', 'email_taken');

    const passwordHash = await argon2.hash(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName,
        locale: data.locale, marketingOptIn: data.marketingOptIn ?? false,
        rgpdConsentAt: new Date(),
      },
    });
    const tokens = await issueTokens(user.id, user.email, user.role, req);
    res.status(201).json({ user: sanitize(user), ...tokens });
  } catch (e) { next(e); }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new HttpError(401, 'Email ou mot de passe incorrect', 'invalid_credentials');
    }
    const tokens = await issueTokens(user.id, user.email, user.role, req);
    res.json({ user: sanitize(user), ...tokens });
  } catch (e) { next(e); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new HttpError(400, 'refreshToken required');
    const payload = verifyRefreshToken(refreshToken);
    const hash = sha256(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new HttpError(401, 'invalid_token');
    // Rotar
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(payload.sub, payload.email, payload.role, req);
    res.json(tokens);
  } catch (e) { next(e); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: sha256(refreshToken) },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// RGPD: derecho de acceso (export)
router.get('/rgpd/export/:userId', async (req, res, next) => {
  try {
    const data = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { addresses: true, orders: { include: { items: true } }, reviews: true, wishlist: true },
    });
    if (!data) throw new HttpError(404, 'User not found');
    const { passwordHash, ...safe } = data as any;
    res.json(safe);
  } catch (e) { next(e); }
});

// RGPD: derecho al borrado
router.delete('/rgpd/account/:userId', async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.userId },
      data: { deletedAt: new Date(), email: `deleted+${nanoid(8)}@removed.local`,
        firstName: null, lastName: null, phone: null, passwordHash: 'DELETED' },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Helpers
function sanitize(u: any) { const { passwordHash, ...safe } = u; return safe; }
function sha256(s: string) { return crypto.createHash('sha256').update(s).digest('hex'); }

async function issueTokens(userId: string, email: string, role: string, req: any) {
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken({ sub: userId, email, role });
  await prisma.refreshToken.create({
    data: {
      userId, tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] ?? null,
      ip: req.ip ?? null,
    },
  });
  return { accessToken, refreshToken };
}

export default router;
