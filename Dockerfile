FROM node:22-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Omit --production flag for TypeScript devDependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  # Allow install without lockfile, so example works even without Node.js installed locally
  else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
  fi

COPY prisma ./prisma
COPY prisma.config.ts .
COPY src ./src
COPY public ./public
COPY next.config.ts .
COPY tsconfig.json .
COPY postcss.config.mjs .
COPY tailwind.config.ts .

# Generate Prisma Client
RUN npx prisma generate


# Next.js app environment variables (required at build time)

ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm build; \
  else npm run build; \
  fi

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema (needed by CLI for migrations/seeding at startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy the already-generated Prisma client — no need to regenerate
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma CLI + tsx for entrypoint (migrate deploy + db seed)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx

# Copy and set up entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

# Environment variables must be redefined at run time
# (defined in the docker-compose.yml)
ENV NEXT_TELEMETRY_DISABLED=1

# Note: Don't expose ports here, Compose will handle that for us
EXPOSE 3000
ENV PORT=3000

CMD ["./docker-entrypoint.sh"]
