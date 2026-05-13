import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),

  ALIEXPRESS_APP_KEY: z.string().optional().default(''),
  ALIEXPRESS_APP_SECRET: z.string().optional().default(''),
  ALIEXPRESS_TRACKING_ID: z.string().optional().default(''),
  CJ_API_TOKEN: z.string().optional().default(''),
  CJ_EMAIL: z.string().optional().default(''),

  COLISSIMO_CONTRACT_NUMBER: z.string().optional().default(''),
  COLISSIMO_PASSWORD: z.string().optional().default(''),
  MONDIALRELAY_BRAND_ID: z.string().default('BDTEST13'),
  MONDIALRELAY_PRIVATE_KEY: z.string().default('PrivateK'),

  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().email().default('contact@goplayelectronic.fr'),
  SMTP_HOST: z.string().optional().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),

  S3_ENDPOINT: z.string().optional().default(''),
  S3_REGION: z.string().default('eu-west-3'),
  S3_ACCESS_KEY: z.string().optional().default(''),
  S3_SECRET_KEY: z.string().optional().default(''),
  S3_BUCKET: z.string().default('goplay-products'),

  COMPANY_NAME: z.string().default('GoPlayElectronic SAS'),
  COMPANY_SIRET: z.string().default('00000000000000'),
  COMPANY_VAT: z.string().default('FR00000000000'),
  COMPANY_ADDRESS: z.string().default('27 Rue Beaujeu, 03500 Saint-Pourçain-sur-Sioule'),
  COMPANY_EMAIL: z.string().default('contact@goplayelectronic.fr'),
  COMPANY_PHONE: z.string().default('+33 6 12 34 56 78'),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
