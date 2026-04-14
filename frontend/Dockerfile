# ── Build CRA ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Bắt buộc khi build (CRA embed vào bundle). Trình duyệt gọi API qua host:port đã map.
ARG REACT_APP_API_BASE_URL=http://localhost:5000
ARG REACT_APP_STRIPE_PUBLIC_KEY=
ARG REACT_APP_STRIPE_TESTING_ASSISTANT=false

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_STRIPE_PUBLIC_KEY=$REACT_APP_STRIPE_PUBLIC_KEY
ENV REACT_APP_STRIPE_TESTING_ASSISTANT=$REACT_APP_STRIPE_TESTING_ASSISTANT

RUN npm run build

# ── Serve static ───────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
