FROM oven/bun:canary as base
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun i --frozen-lockfile

FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

USER bun
EXPOSE 80
ENV PORT 80
ENV HOSTNAME "0.0.0.0"
CMD ["bun", "run", "server.js"]
