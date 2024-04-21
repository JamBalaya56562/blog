FROM oven/bun:canary as base
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun i --frozen-lockfile

FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun test
RUN NODE_ENV=production bun run build

FROM oven/bun:canary-distroless
WORKDIR /usr/src/app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.3 /lambda-adapter /opt/extensions/lambda-adapter

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME 0.0.0.0
CMD ["run", "server.js"]
