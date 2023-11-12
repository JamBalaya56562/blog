FROM oven/bun
WORKDIR /home/bun/app
COPY . .
RUN bun i