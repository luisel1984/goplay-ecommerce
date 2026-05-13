FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "moduleResolution": "Bundler",\n    "rootDir": "src",\n    "outDir": "dist",\n    "strict": false,\n    "skipLibCheck": true,\n    "esModuleInterop": true,\n    "resolveJsonModule": true,\n    "allowSyntheticDefaultImports": true,\n    "noImplicitAny": false,\n    "useDefineForClassFields": true,\n    "lib": ["ES2022"]\n  },\n  "include": ["src/**/*"]\n}' > tsconfig.build.json \
    && npx prisma generate \
    && npx tsc -p tsconfig.build.json

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
