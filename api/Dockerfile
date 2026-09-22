# Imagem oficial do Bun — evita qualquer incerteza sobre suporte nativo a
# Bun no ambiente de build do Render, funciona igual em qualquer host Docker.
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["bun", "run", "start"]
