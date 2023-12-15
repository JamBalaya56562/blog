FROM oven/bun
WORKDIR /home/bun/app
COPY . .
RUN bun i
RUN bun run build
