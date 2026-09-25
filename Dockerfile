# ---------- Сборка ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NUXT_TELEMETRY_DISABLED=1

# Зависимости отдельным слоем — пересобираются только при смене lock-файла.
# --ignore-scripts: postinstall (`nuxt prepare`) требует исходники проекта,
# он всё равно выполнится внутри `nuxt build`.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Значение по умолчанию, «зашиваемое» в сборку; при запуске переопределяется
# переменной NUXT_PUBLIC_API_BASE_URL (ключ runtimeConfig.public.apiBaseUrl)
ARG NUXT_PUBLIC_API_BASE=https://api2.infomania.ru
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE

RUN npx nuxt build

# ---------- Запуск ----------
# .output самодостаточен: Nitro кладёт нужные зависимости в .output/server/node_modules
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NUXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3002

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/').then(() => process.exit(0)).catch(() => process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
