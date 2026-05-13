# 🚀 Guía de Despliegue — GoPlayCommerce

## Arquitectura producción

```
┌──────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│ Vercel (Frontend)    │ ──────▶ │ Railway (Backend)    │ ──────▶ │ Postgres (RW)   │
│ goplayelectronic.fr  │  HTTPS  │ api.goplayelectronic │         │ Redis (Upstash) │
└──────────────────────┘         └──────────────────────┘         └─────────────────┘
       │                                  │ webhooks
       │                                  ▼
       │                          ┌──────────────────┐
       └─────────────────────────▶│  Stripe          │
                                  │  (Payments)      │
                                  └──────────────────┘
```

## 1️⃣ Backend en Railway

### a) Crear proyecto

1. Ve a https://railway.app/new → **Deploy from GitHub Repo**
2. Selecciona `goplay-ecommerce` y la carpeta `/backend`
3. Railway detectará el `Dockerfile` automáticamente

### b) Añadir servicios

```bash
# Desde Railway dashboard:
+ New → Database → PostgreSQL    # crea DATABASE_URL automáticamente
+ New → Database → Redis         # crea REDIS_URL automáticamente
```

### c) Variables de entorno (Settings → Variables)

```
NODE_ENV=production
PORT=4000
APP_URL=https://api.goplayelectronic.fr
FRONTEND_URL=https://goplayelectronic.fr

# Auto desde Railway addon:
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Genera con: openssl rand -hex 64
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Dropship
ALIEXPRESS_APP_KEY=...
ALIEXPRESS_APP_SECRET=...
CJ_API_TOKEN=...
CJ_EMAIL=...

# Shipping
COLISSIMO_CONTRACT_NUMBER=...
COLISSIMO_PASSWORD=...
MONDIALRELAY_BRAND_ID=...
MONDIALRELAY_PRIVATE_KEY=...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=contact@goplayelectronic.fr

# Company
COMPANY_NAME=GoPlayElectronic SAS
COMPANY_SIRET=12345678900012
COMPANY_VAT=FR12345678900
COMPANY_ADDRESS=27 Rue Beaujeu, 03500 Saint-Pourçain-sur-Sioule
COMPANY_EMAIL=contact@goplayelectronic.fr
COMPANY_PHONE=+33 1 23 45 67 89
```

### d) Dominio personalizado

```
Settings → Networking → Custom Domain
→ api.goplayelectronic.fr

# DNS (en tu registrar):
Type: CNAME
Name: api
Value: <subdomain>.up.railway.app
```

### e) Migraciones Prisma

Railway ejecutará automáticamente al deploy gracias al `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]` del Dockerfile.

Para ejecutar manualmente seed o migraciones:
```bash
railway run npx prisma migrate deploy
railway run npm run seed  # solo primera vez
```

## 2️⃣ Frontend en Vercel

### a) Importar proyecto

1. https://vercel.com/new
2. Import del repo `goplay-ecommerce`
3. **Root Directory**: `frontend`
4. **Framework Preset**: Next.js (auto-detectado)

### b) Variables de entorno

```
NEXT_PUBLIC_API_URL=https://api.goplayelectronic.fr/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://goplayelectronic.fr
NEXT_PUBLIC_SITE_NAME=GoPlayElectronic
NEXT_PUBLIC_DEFAULT_LOCALE=fr
```

### c) Dominio personalizado

```
Vercel → Domains → Add → goplayelectronic.fr

DNS:
Type: A   Name: @   Value: 76.76.21.21
Type: CNAME   Name: www   Value: cname.vercel-dns.com
```

### d) ISR + Edge

El `next.config.mjs` ya está optimizado con:
- `headers()` para seguridad (X-Frame-Options, CSP)
- `images.remotePatterns` para CDNs externos
- App Router con `revalidate: 60` en el home

## 3️⃣ Configurar Stripe (production)

### a) Activar cuenta

1. https://dashboard.stripe.com/account/onboarding (validar Business KYC)
2. **Settings → Payment methods**: activar Card, SEPA, Apple Pay, Google Pay, Bancontact
3. **Settings → Tax**: configurar **Stripe Tax** para gestión automática de TVA UE
4. **Settings → Customer emails**: activar emails de recibo automáticos

### b) Webhook

```
Stripe Dashboard → Webhooks → Add endpoint
URL: https://api.goplayelectronic.fr/api/webhook/stripe

Events:
✓ payment_intent.succeeded
✓ payment_intent.payment_failed
✓ charge.refunded
✓ customer.subscription.updated  (si añades suscripciones)
```

Copia el `whsec_…` y mételo en Railway como `STRIPE_WEBHOOK_SECRET`.

### c) Stripe Tax (recomendado para FR/UE)

```
Tax → Settings → Activate Stripe Tax
Tax thresholds → France: déclaration TVA

Cada producto se etiqueta con un Tax Code (ej. txcd_99999999 standard).
Stripe calcula automáticamente la TVA según destino.
```

## 4️⃣ Email transaccional (Resend)

```bash
1. https://resend.com → crea API key
2. Verifica dominio: goplayelectronic.fr (añade DKIM, SPF, DMARC en DNS)
3. Pon RESEND_API_KEY=re_… en Railway
```

Para alta deliverability, configura:
```
TXT @ "v=spf1 include:resend.com ~all"
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:postmaster@goplayelectronic.fr"
CNAME resend._domainkey resend._domainkey.resend.com
```

## 5️⃣ Storage de imágenes (Cloudflare R2)

```
1. Cloudflare → R2 → Create bucket: goplay-products
2. Settings → R2.dev subdomain → activar
3. Genera Access Keys → mete en Railway:
   S3_ENDPOINT=https://<acct>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_ACCESS_KEY=...
   S3_SECRET_KEY=...
   S3_BUCKET=goplay-products
4. Configurar dominio CDN: cdn.goplayelectronic.fr
```

R2 es **gratuito hasta 10GB de almacenamiento + 1M requests/mes** (vs S3 que cobra todo).

## 6️⃣ Cron jobs (sync stock + emails)

Railway soporta cron via **Schedules**:
```
Settings → Cron Schedules → Add
Name: sync-dropship-stock
Cron: 0 * * * *      # cada hora
Command: node dist/jobs/sync-stock.js
```

O alternativa: **Upstash QStash** (HTTP cron gratuito).

## 7️⃣ Monitoring

```bash
# Sentry (errores frontend + backend)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...

# Vercel Analytics: activar desde dashboard (gratuito)

# Uptime: BetterStack / UptimeRobot apuntando a:
https://goplayelectronic.fr
https://api.goplayelectronic.fr/api/health
```

## 8️⃣ Checklist legal antes de lanzar

- [ ] Páginas estáticas creadas: `/cgv`, `/mentions-legales`, `/politique-confidentialite`, `/cookies`
- [ ] SIRET y TVA reales configurados en `.env`
- [ ] Mediador de la consommation contratado y mencionado en footer
- [ ] Banner de cookies funciona y persiste consentimiento
- [ ] Email de notificaciones configurado (`RESEND_API_KEY`)
- [ ] Stripe en modo LIVE con webhook verificado
- [ ] DAC7 reporting si vendes >2000€ o >30 transacciones/año
- [ ] RGPD: formulario de contacto + endpoint de export/borrado funcionando
- [ ] CGV adaptadas: droit de rétractation 14 días (L221-18 Code conso)
- [ ] Mention "TVA non applicable, art. 293 B du CGI" si auto-entrepreneur
- [ ] Conformidad accessibilité RGAA (WCAG 2.1 AA)

## 9️⃣ Costes estimados (mes)

| Servicio | Plan | Coste |
|----------|------|-------|
| Vercel | Hobby | 0€ |
| Railway | Hobby | $5 + uso (~10€) |
| PostgreSQL | Railway 1GB | incluido |
| Redis | Upstash Free | 0€ |
| Stripe | pay-per-use | 1.4% + 0.25€/transac (FR) |
| Resend | Free 3k emails/mo | 0€ |
| Cloudflare R2 | Free 10GB | 0€ |
| Sentry | Developer | 0€ |
| Dominio + SSL | OVH/Gandi | ~10€/an |
| **Total mes** | | **~10-15€** |

A escala (100k visitas/mes): ~€80-150/mes.

## 🔧 Despliegue local con Docker (alternativa)

```bash
# Postgres + Redis + MailHog
docker-compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev

# Frontend (otra terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Abre http://localhost:3000 y http://localhost:4000/api/health

Acceso de prueba:
- 👤 Admin: `admin@goplayelectronic.fr` / `admin123`
- 👤 Cliente: `sophie.martin@example.com` / `user123`
- 🎟️ Cupones: `BIENVENUE10` (-10%) · `LIVRAISON` (-5€)
