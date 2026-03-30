# syntax=docker.io/docker/dockerfile-upstream:1.23.0-rc1-labs
# check=error=true
FROM oven/bun:canary AS builder
WORKDIR /usr/src/app
RUN --mount=type=bind,source=package.json,target=package.json \
  --mount=type=bind,source=bun.lock,target=bun.lock \
  --mount=type=cache,target=/root/.bun \
  bun i --frozen-lockfile
COPY . .
RUN bun test:app
ARG CONTENT_SOURCE=github
ARG GITHUB_OWNER=JamBalaya56562
ARG GITHUB_REPO=blog
ARG GITHUB_BRANCH=main
ARG GITHUB_CONTENT_PATH=content
ENV CONTENT_SOURCE=${CONTENT_SOURCE} GITHUB_OWNER=${GITHUB_OWNER} GITHUB_REPO=${GITHUB_REPO} GITHUB_BRANCH=${GITHUB_BRANCH} GITHUB_CONTENT_PATH=${GITHUB_CONTENT_PATH}
RUN bun run build

FROM gcr.io/distroless/nodejs24-debian13:nonroot
WORKDIR /app
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.0 /lambda-adapter /opt/extensions/lambda-adapter

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

EXPOSE 3000
ARG CONTENT_SOURCE=github
ARG GITHUB_OWNER=JamBalaya56562
ARG GITHUB_REPO=blog
ARG GITHUB_BRANCH=main
ARG GITHUB_CONTENT_PATH=content
ENV AWS_LWA_ENABLE_COMPRESSION=true AWS_LWA_INVOKE_MODE=response_stream HOSTNAME=0.0.0.0 PORT=3000 CONTENT_SOURCE=${CONTENT_SOURCE} GITHUB_OWNER=${GITHUB_OWNER} GITHUB_REPO=${GITHUB_REPO} GITHUB_BRANCH=${GITHUB_BRANCH} GITHUB_CONTENT_PATH=${GITHUB_CONTENT_PATH}
ENTRYPOINT ["/nodejs/bin/node", "server.js"]
