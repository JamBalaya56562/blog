FROM oven/bun:1.0.18
COPY . .
RUN bun i
RUN bun run build
