# Quick Start Guide

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL database (for testing)

## Installation

```bash
# Clone or navigate to project
cd BosDB

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local and set:
# ENCRYPTION_MASTER_KEY=your-super-secret-key-here
```

## Development

### Start test database (Docker)

```bash
docker-compose up -d
```

This starts a PostgreSQL database with:
- Host: localhost
- Port: 5432
- Database: testdb
- Username: testuser
- Password: testpass

### Run development server

```bash
# Start all packages in watch mode
pnpm dev
```

The application will be available at http://localhost:3000

### Build for production

```bash
# Build all packages
pnpm build

# Start production server
cd apps/web
pnpm start
```

## Using BosDB

### 1. Create a Connection

1. Navigate to http://localhost:3000
2. Click "Get Started" or "New Connection"
3. Fill in connection details:
   - Name: "My Local DB"
   - Type: PostgreSQL
   - Host: localhost
   - Port: 5432
   - Database: testdb
   - Username: testuser
   - Password: testpass
4. Click "Create Connection"

### 2. Execute Queries

1. From dashboard, click "Open Query Editor" on your connection
2. Write a SQL query:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public' 
   LIMIT 10;
   ```
3. Click "Run Query"
4. View results in the table below
5. (Optional) Click "Export CSV" to download results

### 3. Explore Schema

- View available schemas in the left sidebar
- See table counts for each schema

## Project Structure

```
bosdb/
├── apps/web/           # Next.js frontend
├── packages/
│   ├── core/           # Types and constants
│   ├── db-adapters/    # Database adapters
│   ├── security/       # Encryption & validation
│   └── utils/          # Logger and utilities
├── docs/               # Documentation
└── docker-compose.yml  # Test database
```

## Available Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build all packages
pnpm lint       # Lint code
pnpm clean      # Clean build artifacts
```

## Troubleshooting

### Connection fails
- Ensure PostgreSQL is running
- Check host/port/credentials
- Verify firewall settings

### Build errors
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear build cache: `pnpm clean`

### Environment variables not working
- Ensure .env.local exists in project root
- Restart dev server after changing env vars

## Next Steps

- Read [ARCHITECTURE.md](file:///home/arushgupta/Desktop/BosDB/docs/ARCHITECTURE.md) for system design
- Read [walkthrough.md](file:///home/arushgupta/.gemini/antigravity/brain/3641bf9a-427c-40d1-8b4e-e64b90bf5229/walkthrough.md) for implementation details
- Explore adding MySQL or MongoDB adapters
