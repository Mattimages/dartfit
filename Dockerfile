# One image serves the API and the built web app. Migrations run on start.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/catalogue/package.json packages/catalogue/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci
COPY . .
# Downloads the MediaPipe Tasks hand model (better than the bundled fallback). Needs network.
RUN npm run fetch-model || echo "fetch-model failed: the bundled MediaPipe Hands detector will be used"
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && npm start"]
