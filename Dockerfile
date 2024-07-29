# syntax=docker.io/docker/dockerfile-upstream:1.9.0-labs
FROM oven/bun:canary AS base
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json bun.lockb ./
RUN bun i --frozen-lockfile

FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN bun test
RUN bun run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

EXPOSE 3000
ENV AWS_LWA_ENABLE_COMPRESSION=true AWS_LWA_INVOKE_MODE=response_stream HOSTNAME=0.0.0.0 PORT=3000
ENTRYPOINT [ "/nodejs/bin/node", "server.js"]
