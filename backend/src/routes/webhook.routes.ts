import { Router, raw } from 'express';
import { handleStripeWebhook } from '../services/stripe.service.js';
import { logger } from '../config/logger.js';

const router = Router();

// IMPORTANT: This route MUST receive raw body (no JSON parsing)
router.post('/stripe', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) return res.status(400).send('No signature');
  try {
    const result = await handleStripeWebhook(req.body, sig);
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Webhook error');
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
