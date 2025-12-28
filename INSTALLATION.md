# BosDB - Installation Guide

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher  
- **Docker** 20.0.0+ (for test databases)
- **Docker Compose** 1.29.0+

### System Requirements
- **OS:** Linux, macOS, or Windows
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 5GB free space minimum
- **Browser:** Chrome, Firefox, Safari, or Edge (latest versions)

---

## Installation Steps

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd BosDB
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install:
# - Frontend dependencies (@bosdb/web)
# - All package dependencies (core, db-adapters, security, utils)
# - Development tools
```

### 3. Set Up Environment Variables

```bash
# Navigate to web app
cd apps/web

# Create .env file
touch .env
```

**Add to `.env`:**
```env
# Required - 32-character encryption key
ENCRYPTION_MASTER_KEY=your-32-character-secret-key-here

# Optional
NODE_ENV=development
```

**Generate a secure key:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Build Packages

```bash
# Return to project root
cd ../..

# Build all packages
npm run build

# OR build individually
cd packages/core && npm run build
cd ../db-adapters && npm run build
cd ../security && npm run build
cd ../utils && npm run build
```

### 5. Start Development Server

```bash
# From project root
npm run dev

# Server will start at http://localhost:3000
# (or http://localhost:3001 if 3000 is in use)
```

---

## Database Setup

### Option 1: Using Docker Compose (Recommended)

BosDB includes a `docker-compose.yml` for quick database setup:

```bash
# Start all databases
docker-compose up -d

# Start specific database
docker-compose up -d postgres
docker-compose up -d mysql  
docker-compose up -d mongodb

# Check running containers
docker ps

# View logs
docker-compose logs -f postgres

# Stop all databases
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Default Credentials:**

| Database   | Host      | Port  | Database | Username | Password  |
|-----------|-----------|-------|----------|----------|-----------|
| PostgreSQL | localhost | 5432  | postgres | postgres | arush098  |
| MySQL      | localhost | 3306  | testdb   | root     | rootpass  |
| MongoDB    | localhost | 27017 | testdb   | root     | rootpass  |

### Option 2: Manual Installation

#### PostgreSQL
```bash
# Ubuntu/Debian
sudo apt-get install postgresql

# macOS
brew install postgresql

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

#### MySQL
```bash
# Ubuntu/Debian
sudo apt-get install mysql-server

# macOS
brew install mysql

# Start service
sudo systemctl start mysql       # Linux
brew services start mysql        # macOS
```

#### MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org

# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start service
sudo systemctl start mongod      # Linux
brew services start mongodb-community  # macOS
```

#### Redis
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start service
sudo systemctl start redis       # Linux
brew services start redis        # macOS
```

---

## First-Time Setup

### 1. Access Application

Open browser and navigate to:
```
http://localhost:3000
```

### 2. Create First Connection

1. Click **"New Connection"** on dashboard
2. Fill in details:
   ```
   Name: My PostgreSQL
   Type: PostgreSQL
   Host: localhost
   Port: 5432
   Database: postgres
   Username: postgres
   Password: arush098
   ```
3. Click **"Create Connection"**
4. Connection should appear in dashboard

### 3. Test Connection

1. Click **"Run Query"** on the connection card
2. Query editor will open
3. Run default query or try:
   ```sql
   SELECT version();
   ```
4. Results should appear below editor

---

## Troubleshooting

### Port Already in Use

If port 3000 is in use:

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port
export PORT=3001
npm run dev
```

### Database Connection Failed

**PostgreSQL/MySQL/MongoDB not running:**
```bash
# Check if database is running
docker ps  # if using Docker

# Check service status
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Restart database
docker-compose restart postgres
```

**Wrong credentials:**
- Verify credentials in `.bosdb-connections.json`
- Try creating a new connection
- Check database user permissions

### Build Errors

**TypeScript errors:**
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Module not found:**
```bash
# Rebuild all packages
cd packages/core && npm run build
cd ../db-adapters && npm run build
cd ../security && npm run build
cd ../utils && npm run build
```

### Disk Space Issues

If getting `ENOSPC` errors:

```bash
# Clean Docker
docker system prune -a --volumes -f

# Clean npm cache
npm cache clean --force

# Clean build artifacts
rm -rf */node_modules
rm -rf **/dist
npm install
```

---

## Production Deployment

### Build for Production

```bash
# Build all packages
npm run build

# Start production server
cd apps/web
npm run build
npm start
```

### Environment Setup

**Production `.env`:**
```env
NODE_ENV=production
ENCRYPTION_MASTER_KEY=<strong-production-key>
```

### Database Configuration

For production, use:
- Managed database services (AWS RDS, Azure DB, etc.)
- Proper firewall rules
- SSL/TLS connections
- Strong passwords
- Regular backups

---

## Verification

### Check Installation

```bash
# Verify Node.js
node --version  # Should be 18+

# Verify npm
npm --version   # Should be 9+

# Verify Docker
docker --version
docker-compose --version

# Check running processes
npm run dev     # Should start without errors
```

### Test All Features

1. ✅ Create connection
2. ✅ Run query
3. ✅ Browse schema
4. ✅ Save query
5. ✅ View history
6. ✅ Toggle theme
7. ✅ Export CSV
8. ✅ Access settings
9. ✅ Read documentation

---

## Uninstallation

```bash
# Stop dev server (Ctrl+C)

# Stop databases
docker-compose down -v

# Remove node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Remove build artifacts
rm -rf apps/*/dist
rm -rf packages/*/dist
rm -rf apps/*/.next

# Remove data files (optional)
rm .bosdb-*.json
```

---

## Getting Help

- **Documentation:** Access `/docs` in the running application
- **Issues:** Check SUMMARY.md for known issues
- **Logs:** Check browser console and terminal output

---

## Next Steps

After installation:
1. ✅ Create connections for your databases
2. ✅ Explore the schema explorer
3. ✅ Try sample queries
4. ✅ Save frequently used queries
5. ✅ Customize settings and theme

**Happy querying! 🚀**
