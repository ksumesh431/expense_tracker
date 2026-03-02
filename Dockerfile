# ============================================================
# Dockerfile — Multi-Stage Production Build
# ============================================================
# Stage 1: Build with Bun (fast, produces static files)
# Stage 2: Serve with Nginx Alpine (minimal, ~7MB final image)
#
# Target: arm64 (Oracle Cloud) — both base images support arm64
#
# Build:
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
#     -t expense-tracker .
#
# Run:
#   docker run -d -p 8080:8080 --name expdr expense-tracker
# ============================================================

# ── Stage 1: Build ─────────────────────────────────────────
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS builder

WORKDIR /app

# Install deps first (cache layer — only re-runs when lockfile changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .

# Accept env vars as build args (Vite embeds them at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

RUN bun run build

# ── Stage 2: Serve ─────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default nginx config and static files
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy our nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /tmp/nginx.pid && \
    chown appuser:appgroup /tmp/nginx.pid

USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=2 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
