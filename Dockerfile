# syntax=docker.io/docker/dockerfile-upstream:1.11.0-labs
FROM oven/bun:canary AS builder
WORKDIR /usr/src/app
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=bun.lockb,target=bun.lockb \
  --mount=type=cache,target=/root/.bun \
  bun i --frozen-lockfile
COPY . .
RUN bun test:app
RUN bun run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

EXPOSE 3000
ENV AWS_LWA_ENABLE_COMPRESSION=true AWS_LWA_INVOKE_MODE=response_stream HOSTNAME=0.0.0.0 PORT=3000
ENTRYPOINT ["/nodejs/bin/node", "server.js"]
