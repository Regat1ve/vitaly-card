# Сборка и запуск разведены по стадиям: в финальный образ не попадают
# ни исходники на TypeScript, ни devDependencies, ни кэш npm.
#
# База — Debian slim, а не Alpine. На Alpine (musl) движок запросов Prisma
# не находит libssl и падает уже на db push: «Could not parse schema engine
# response». Лечится установкой openssl и правильным binaryTarget, но проще
# и надёжнее взять образ, где OpenSSL на месте. Поймано в CI, а не «на глаз».

FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Сначала манифесты и схема Prisma — так слой с npm ci переиспользуется,
# пока зависимости не менялись. postinstall генерирует клиент Prisma.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY scripts ./scripts
COPY src ./src
COPY public ./public
# prebuild вшивает public/index.html в сборку, поэтому scripts нужны в образе.
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Зависимости без dev; postinstall снова генерирует клиент Prisma —
# поэтому prisma лежит в dependencies, а не в devDependencies.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Контейнер не должен ходить под root: одна найденная дыра — и это уже root в системе.
RUN addgroup --system app && adduser --system --ingroup app app && chown -R app:app /app
USER app

EXPOSE 3000

# Проверка живости бьёт в тот же /health, что и человек: он дёргает базу,
# а не рапортует «ok» из процесса, который её не видит.
HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>r.json()).then(b=>process.exit(b.database==='up'?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
