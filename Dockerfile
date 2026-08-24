# Сборка и запуск разведены по стадиям: в финальный образ не попадают
# ни исходники на TypeScript, ни devDependencies, ни кэш npm.

FROM node:22-alpine AS build
WORKDIR /app

# Сначала манифесты и схема Prisma — так слой с npm ci переиспользуется,
# пока зависимости не менялись. postinstall генерирует клиент Prisma.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY public ./public
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

# Зависимости без dev; postinstall снова генерирует клиент Prisma —
# поэтому prisma лежит в dependencies, а не в devDependencies.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Контейнер не должен ходить под root: одна найденная дыра — и это уже root в системе.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000

# Проверка живости бьёт в тот же /health, что и человек: он дёргает базу,
# а не рапортует «ok» из процесса, который её не видит.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=4 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>r.json()).then(b=>process.exit(b.database==='up'?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
