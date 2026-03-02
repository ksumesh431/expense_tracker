# Expense Tracker

Personal expense tracking web app — replaces manual Excel workflows.

## Stack

- **Frontend**: React + TypeScript + Tailwind CSS v4
- **Backend**: Supabase (Postgres)
- **Bundler**: Vite + Bun
- **Container**: Nginx Alpine (~49MB)
- **CI/CD**: CircleCI → Docker Hub (multi-arch: amd64 + arm64)

## Local Dev

```bash
bun install
bun run dev
```

## Docker

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=<url> \
  --build-arg VITE_SUPABASE_ANON_KEY=<key> \
  -t expense-tracker .

docker run -d -p 8080:8080 expense-tracker
```

## Database

Run `supabase_schema.sql` in Supabase SQL Editor to create the `expenses` table.
