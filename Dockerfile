FROM node:21.6.1 as base
WORKDIR /app
RUN npm install -g bun

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun i --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun test
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:canary-distroless
WORKDIR /usr/src/app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.1 /lambda-adapter /opt/extensions/lambda-adapter

ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nonroot
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["run", "server.js"]
