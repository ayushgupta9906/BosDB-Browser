# BosDB - Browser-based Online SQL Database Manager

A production-grade, web-based database management tool for modern cloud databases.

## Features

- 🔌 Multi-database support (PostgreSQL, MySQL, MongoDB)
- 🔐 Secure credential management with AES-256-GCM encryption
- 🏢 Multi-tenant architecture with workspace isolation
- 📊 Advanced SQL editor with Monaco
- 🌳 Interactive schema explorer
- 📈 Query history and saved queries
- 🚀 Production-ready with horizontal scaling support

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Node.js with TypeScript
- **Database Adapters**: Pluggable adapter pattern
- **Security**: End-to-end encryption, SQL injection protection
- **Scaling**: Redis caching, connection pooling, horizontal scaling

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js) or pnpm >= 8.0.0 (recommended)

### Quick Setup

```bash
# Run automated setup script
./setup.sh

# Or manual setup:
npm install  # or: pnpm install
cp .env.example .env.local

# Start development server
npm run dev  # or: pnpm dev
```

### Development

```bash
# Run all workspaces in dev mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Project Structure

```
bosdb/
├── apps/
│   └── web/              # Next.js application
├── packages/
│   ├── core/             # Shared types and interfaces
│   ├── db-adapters/      # Database adapter implementations
│   ├── security/         # Security utilities
│   └── utils/            # Common utilities
└── turbo.json            # Turborepo configuration
```

## Documentation

See [implementation_plan.md](docs/implementation_plan.md) for detailed architecture and design decisions.

## License

MIT
