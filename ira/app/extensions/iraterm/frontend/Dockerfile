FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG VITE_TERMINAL_WS_URL=ws://localhost:3001/ws/terminal
ENV VITE_TERMINAL_WS_URL=$VITE_TERMINAL_WS_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
