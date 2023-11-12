FROM debian
RUN mkdir -p /home/bun/app
WORKDIR /home/bun/app
COPY . .
#RUN bun i