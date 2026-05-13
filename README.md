# GoPlayCommerce — E-Commerce + Dropshipping (France)

Sistema **production-ready** de e-commerce con dropshipping enfocado en el mercado francés.

## 🏗️ Arquitectura

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│  Next.js 14 (App Router)│────▶│  Node.js + Express + TS │────▶│  PostgreSQL  │
│  React 18 · Tailwind    │     │  Prisma ORM             │     │  (Railway)   │
│  next-intl (i18n FR/EN) │     │  Stripe · Colissimo API │     └──────────────┘
│  Stripe Elements        │     │  AliExpress · CJ        │     ┌──────────────┐
│  Vercel                 │     │  Railway                │────▶│  Redis cache │
└─────────────────────────┘     └─────────────────────────┘     └──────────────┘
```

| Capa | Tecnología | Despliegue |
|------|-----------|------------|
| Frontend | Next.js 14 · React 18 · Tailwind · TypeScript · next-intl | Vercel |
| Backend | Node.js 20 · Express · TypeScript · Prisma | Railway |
| Database | PostgreSQL 16 | Railway / Supabase |
| Cache & Sesiones | Redis | Railway / Upstash |
| Pagos | Stripe (Carte Bancaire, SEPA, Apple/Google Pay) | — |
| Envíos | Colissimo La Poste · Mondial Relay · Chronopost | — |
| Dropshipping | AliExpress (DS Center) · CJDropshipping API | — |
| Email | Resend / SendGrid | — |
| Storage | Cloudflare R2 / AWS S3 | — |
| Monitorización | Sentry · Vercel Analytics | — |

## 📁 Estructura del proyecto

```
goplay-ecommerce/
├── backend/                       Node.js + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── server.ts              Entry point
│   │   ├── app.ts                 Express app config
│   │   ├── config/                env, prisma, redis
│   │   ├── middleware/            auth, error, rate-limit, RGPD logger
│   │   ├── routes/                REST API (auth, products, cart, orders, …)
│   │   ├── controllers/           Business logic per endpoint
│   │   ├── services/              External integrations
│   │   │   ├── stripe.service.ts
│   │   │   ├── shipping.service.ts   Colissimo + Mondial Relay
│   │   │   ├── invoice.service.ts    Facture PDF avec TVA
│   │   │   ├── email.service.ts
│   │   │   └── dropship/             AliExpress · CJ adapters
│   │   └── lib/                    vat, jwt, pdf, helpers
│   ├── prisma/
│   │   ├── schema.prisma           Postgres schema
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                       Next.js 14 App Router
│   ├── app/
│   │   ├── [locale]/               i18n: /fr, /en
│   │   │   ├── (shop)/             Boutique
│   │   │   │   ├── page.tsx          Accueil
│   │   │   │   ├── produits/
│   │   │   │   ├── panier/
│   │   │   │   ├── commande/
│   │   │   │   ├── compte/
│   │   │   │   └── liste-souhaits/
│   │   │   ├── (auth)/             Login/Register
│   │   │   └── admin/              Panel admin
│   │   ├── api/
│   │   │   ├── webhook/stripe/     Stripe webhook receiver
│   │   │   └── revalidate/         ISR revalidation
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                 ui · shop · layout · admin · rgpd
│   ├── lib/                        api client · stripe · i18n · utils
│   ├── messages/                   fr.json · en.json
│   ├── middleware.ts               next-intl + auth
│   ├── package.json
│   ├── next.config.mjs
│   └── tailwind.config.ts
│
├── docker-compose.yml              Postgres + Redis local
├── DEPLOYMENT.md                   Guía despliegue Vercel + Railway
└── README.md
```

## 🚀 Quick start (local)

### 1. Prerrequisitos
- Node.js 20+
- Docker Desktop (para Postgres + Redis local)
- Cuenta Stripe (modo test) → https://dashboard.stripe.com/test/apikeys

### 2. Clonar y configurar
```bash
git clone <tu-repo> goplay-ecommerce
cd goplay-ecommerce
docker-compose up -d        # Postgres + Redis
```

### 3. Backend
```bash
cd backend
cp .env.example .env        # Configura las variables (ver más abajo)
npm install
npx prisma migrate dev --name init
npm run seed                # Datos de prueba
npm run dev                 # http://localhost:4000
```

### 4. Frontend
```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### 5. Stripe webhook (desarrollo)
```bash
stripe listen --forward-to localhost:4000/api/webhook/stripe
# Copia el whsec_… al backend/.env como STRIPE_WEBHOOK_SECRET
```

## 🔐 Variables de entorno clave

### `backend/.env`
```
DATABASE_URL=postgresql://goplay:goplay@localhost:5432/goplay
REDIS_URL=redis://localhost:6379
JWT_SECRET=cambia-esto-por-un-string-largo
JWT_REFRESH_SECRET=otro-string-largo

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Dropshipping
ALIEXPRESS_APP_KEY=...
ALIEXPRESS_APP_SECRET=...
CJ_API_TOKEN=...

# Shipping (FR)
COLISSIMO_CONTRACT_NUMBER=...
COLISSIMO_PASSWORD=...
MONDIALRELAY_BRAND_ID=...
MONDIALRELAY_PRIVATE_KEY=...

# Email
RESEND_API_KEY=...
EMAIL_FROM=contact@goplayelectronic.fr

# Storage
S3_ENDPOINT=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=goplay-products

# RGPD & legal
COMPANY_NAME=GoPlayElectronic SAS
COMPANY_SIRET=000000000 00000
COMPANY_VAT=FR00000000000
COMPANY_ADDRESS="27 Rue Beaujeu, 03500 Saint-Pourçain-sur-Sioule"
```

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_SECRET=secret-de-sesion
```

## 🇫🇷 Cumplimiento legal francés

- ✅ **TVA française**: 20% standard, 5.5% libros/comida, gestión auto vía `lib/vat.ts`
- ✅ **Facture PDF**: numerada, con SIRET, TVA intracommunautaire, mentions légales
- ✅ **RGPD**: banner de cookies (axeptio-style), consentimiento granular, derecho de acceso/borrado
- ✅ **CGV / Mentions légales**: páginas estáticas requeridas (`/cgv`, `/mentions-legales`, `/politique-confidentialite`)
- ✅ **Droit de rétractation**: 14 días según L221-18 Code de la consommation
- ✅ **Médiateur de la consommation**: campo en footer

## 📊 Funcionalidades

### Cliente
- 🛒 Carrito persistente (localStorage + DB cuando login)
- ❤️ Lista de deseos
- 🔍 Búsqueda con filtros (categoría, marca, precio, disponibilidad)
- 💳 Checkout Stripe (CB, SEPA, Apple Pay, Google Pay)
- 📦 Selección punto Mondial Relay vía widget oficial
- 🚚 Tracking en tiempo real (Colissimo + Mondial Relay)
- 📄 Descarga de facturas PDF
- 🔐 Cuenta cliente (perfil, pedidos, direcciones, RGPD)
- 🌐 i18n: FR (primary) / EN

### Admin
- 📊 Dashboard con KPIs (ventas, pedidos, márgenes, top productos)
- 📦 Gestión inventario + variantes (talla, color, …)
- 🚚 Gestión pedidos con estados (paid → preparing → shipped → delivered)
- 👥 Clientes con histórico
- 🎟️ Cupones (% / €, mínimo de pedido, fecha de caducidad)
- 💰 Reportes con exportación CSV
- 🤖 **Dropshipping**: importar productos desde AliExpress / CJ con un click, sync automático de stock + precios
- 🔄 Forwarding automático de pedidos a proveedor
- 📈 Sincronización stock cada hora vía cron job

## 🌐 Despliegue producción

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa: **Vercel** (frontend) + **Railway** (backend + DB + Redis) + **Stripe** + dominios + DNS + SSL.

## 📜 Licencia
MIT — © 2026 GoPlayElectronic SAS
