FROM oven/bun
WORKDIR /home/bun/app
COPY . .
RUN bun i

LABEL org.opencontainers.image.source=https://github.com/JamBalaya56562/Blog
LABEL org.opencontainers.image.description="My blog image"
LABEL org.opencontainers.image.licenses=MIT