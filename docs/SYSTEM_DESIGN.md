# BosDB - System Design Document

## Executive Summary

BosDB is a production-grade, browser-based database management tool designed for modern cloud databases. It provides secure, scalable access to PostgreSQL (with MySQL and MongoDB support planned) through a web interface, featuring SQL editing, schema exploration, and query execution with enterprise-grade security.

## System Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────┐
│                   Client Browser                      │
│  ┌────────────────────────────────────────────────┐  │
│  │      Next.js Frontend (React + TypeScript)     │  │
│  │  - Monaco SQL Editor                           │  │
│  │  - Schema Explorer                             │  │
│  │  - Connection Management UI                    │  │
│  │  - Query Results Table                         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                         ↓ HTTPS
┌──────────────────────────────────────────────────────┐
│            Next.js Application Server                 │
│  ┌────────────────────────────────────────────────┐  │
│  │         API Routes (Backend Logic)             │  │
│  │  /api/connections  - Connection CRUD           │  │
│  │  /api/query        - Query execution           │  │
│  │  /api/schema       - Metadata retrieval        │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │         Security Layer (@bosdb/security)       │  │
│  │  - AES-256-GCM Credential Encryption          │  │
│  │  - SQL Injection Detection                     │  │
│  │  - Read-only Query Validation                  │  │
│  └────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────┐  │
│  │      Database Adapter Layer (@bosdb/db-adapters│  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  | IDBAdapter Interface                     |  │  │
│  │  ├──────────────────────────────────────────┤  │  │
│  │  | PostgreSQLAdapter (Implemented)          |  │  │
│  │  | MySQLAdapter (Planned)                   |  │  │
│  │  | MongoDBAdapter (Planned)                 |  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│           External User Databases                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ PostgreSQL  │  │    MySQL    │  │   MongoDB   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer (Next.js 14 + React)

**Technology Stack:**
- Next.js 14 (App Router)
- React 18 with TypeScript
- Monaco Editor for SQL editing
- Tailwind CSS for styling
- next-themes for dark mode

**Key Components:**

#### Landing Page (`/`)
- Feature showcase
- Call-to-action
- Modern glassmorphism design

#### Dashboard (`/dashboard`)
- Connection list with status
- New connection modal
- Quick action cards
- Real-time connection status

#### Query Editor (`/query`)
- Monaco editor with SQL syntax highlighting
- Schema explorer sidebar
- Results table with virtualization
- CSV export functionality
- Execution metrics display

### 2. API Layer (Next.js API Routes)

**Security-First Design:**
- No credential exposure to frontend
- All sensitive operations server-side
- Validation at every layer

**Endpoints:**

#### POST /api/connections
```typescript
Request: {
  name: string,
  type: 'postgresql' | 'mysql' | 'mongodb',
  host: string,
  port: number,
  database: string,
  username: string,
  password: string,
  ssl?: boolean,
  readOnly?: boolean
}

Response: {
  id: string,
  name: string,
  type: string,
  host: string,
  port: number,
  database: string,
  readOnly: boolean,
  status: 'connected' | 'disconnected'
}
```

Flow:
1. Validate inputs
2. Test connection
3. Encrypt credentials
4. Store connection metadata
5. Return safe data (no password)

#### POST /api/query
```typescript
Request: {
  connectionId: string,
  query: string,
  timeout?: number,
  maxRows?: number
}

Response: {
  success: boolean,
  rows: any[],
  fields: QueryField[],
  rowCount: number,
  executionTime: number,
  hasMore?: boolean
}
```

Security Flow:
1. Validate query (SQL injection check)
2. Check read-only constraints
3. Decrypt credentials (server-side only)
4. Execute with timeout
5. Apply row limits
6. Return results

### 3. Database Adapter Layer

**Design Pattern:** Strategy Pattern with Dependency Injection

**IDBAdapter Interface:**
```typescript
interface IDBAdapter {
  // Connection lifecycle
  connect(config: ConnectionConfig): Promise<ConnectionResult>
  disconnect(connectionId: string): Promise<void>
  testConnection(config: ConnectionConfig): Promise<TestResult>
  
  // Metadata operations
  listSchemas(connectionId: string): Promise<Schema[]>
  listTables(connectionId: string, schema?: string): Promise<Table[]>
  describeTable(connectionId: string, schema: string, table: string): Promise<TableMetadata>
  getIndexes(connectionId: string, schema: string, table: string): Promise<Index[]>
  
  // Query operations
  executeQuery(request: QueryRequest): Promise<QueryResult>
  explainQuery(connectionId: string, query: string): Promise<ExplainResult>
  
  // Info
  getVersion(connectionId: string): Promise<string>
  getDatabaseInfo(connectionId: string): Promise<DatabaseInfo>
}
```

**PostgreSQL Adapter Implementation:**
- Connection pooling (10-50 connections)
- Comprehensive metadata queries
- Type mapping (OID → readable types)
- EXPLAIN plan support
- Transaction support ready

### 4. Security Layer

#### Credential Encryption

**Algorithm:** AES-256-GCM (Authenticated Encryption)

**Implementation:**
```typescript
class CredentialEncryption {
  encrypt(data: any): string {
    // 1. Generate random IV (16 bytes)
    // 2. Create cipher with AES-256-GCM
    // 3. Encrypt data
    // 4. Get authentication tag
    // 5. Combine: IV + encrypted + tag
    // 6. Base64 encode
  }
  
  decrypt(encryptedData: string): any {
    // 1. Base64 decode
    // 2. Extract IV, tag, encrypted data
    // 3. Create decipher
    // 4. Verify authentication tag
    // 5. Decrypt and return
  }
}
```

**Key Management:**
- Master key from environment variable
- scrypt key derivation with salt
- Key rotation ready

#### SQL Injection Protection

**Multi-Level Defense:**

1. **Pattern Detection**
   - High severity: DROP, TRUNCATE, xp_cmdshell, LOAD_FILE
   - Medium severity: UNION SELECT, multiple statements
   
2. **Read-only Enforcement**
   - Validates query starts with SELECT/EXPLAIN/SHOW
   - Blocks writes on read-only connections

3. **Parameterization Ready**
   - Adapter supports prepared statements
   - Future enhancement for all queries

### 5. Data Flow

#### Query Execution Flow

```
1. User writes SQL in Monaco Editor
2. Clicks "Run Query"
3. Frontend sends POST /api/query
4. API validates query (SQL injection check)
5. API checks read-only constraints
6. API decrypts credentials
7. Gets/creates adapter instance
8. Adapter executes query with:
   - Connection from pool
   - Timeout set
   - Row limit applied
9. Results returned to frontend
10. Rendered in table
11. CSV export available
```

#### Connection Creation Flow

```
1. User fills connection form
2. Frontend sends POST /api/connections
3. API validates required fields
4. API creates adapter
5. Adapter tests connection
6. On success:
   - Encrypt credentials
   - Store connection metadata
   - Return safe data to frontend
7. Frontend refreshes connection list
```

## Scaling Strategy

### Current Architecture (Single Instance)

- Supports 100-500 concurrent users
- In-memory connection storage
- Single Next.js instance

### Production Architecture (10k+ Users)

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (nginx/ALB)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │ Next.js 1 │      │ Next.js 2 │     │ Next.js N │
    └─────┬─────┘      └─────┬─────┘     └─────┬─────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
        ┌────▼────┐    ┌─────▼─────┐  ┌─────▼─────┐
        │  Redis  │    │  App DB   │  │   Queue   │
        │ (Cache) │    │(Metadata) │  │ (BullMQ)  │
        └─────────┘    └───────────┘  └───────────┘
```

**Scaling Components:**

1. **Horizontal Scaling**
   - 10-20 stateless Next.js instances
   - Each handles 500-1000 users
   - Auto-scaling based on CPU/memory

2. **Redis Caching**
   - Schema metadata (5min TTL)
   - Connection info
   - Session storage
   - Reduces database queries by 70%

3. **Connection Pooling**
   - 10-20 connections per database per instance
   - Automatic pool cleanup
   - Idle timeout: 30s
   - Max pool size: configurable

4. **Query Queue**
   - Long queries (>10s) to background
   - WebSocket for completion notification
   - Prevents blocking API threads

5. **Database Read Replicas**
   - Metadata queries → replicas
   - Write operations → primary
   - 80/20 read/write split

6. **Rate Limiting**
   - Per user: 30 queries/minute
   - Per connection: 100 concurrent queries
   - Global: 10k queries/second

### Performance Optimizations

**Caching Strategy:**
- Schema metadata: 5 minutes
- Connection metadata: 15 minutes
- Query results: Optional (user-enabled)

**Query Optimization:**
- Default timeout: 30s
- Max timeout: 5 minutes
- Default row limit: 1000
- Max row limit: 100,000
- Streaming for large results (future)

## Security Considerations

### Threat Model

**Threats Mitigated:**

1. **Credential Theft**
   - ✓ AES-256-GCM encryption at rest
   - ✓ Never exposed to frontend
   - ✓ Encrypted in logs

2. **SQL Injection**
   - ✓ Multi-level pattern detection
   - ✓ Query validation
   - ✓ Prepared statements ready

3. **Unauthorized Access**
   - ✓ Read-only mode enforcement
   - ✓ Rate limiting (planned)
   - ✓ Audit logging

4. **Data Exfiltration**
   - ✓ Row limits
   - ✓ Query timeouts
   - ✓ Network isolation

### Compliance

**Ready for:**
- GDPR (audit logs, data encryption)
- SOC 2 (access controls, logging)
- HIPAA (encryption, audit trails)

## Future Enhancements

### Phase 2 - MySQL Support
- MySQL adapter implementation
- MySQL-specific metadata queries
- Connection pooling optimizations

### Phase 3 - MongoDB Support
- Document-oriented adapter
- Aggregation pipeline builder
- JSON result viewer

### Phase 4 - Advanced Features
- SSH tunneling
- Real-time collaboration
- AI-powered SQL assistant
- ERD visualization
- Query version control

### Phase 5 - Enterprise
- SSO integration (SAML, OAuth)
- Multi-region deployment
- Disaster recovery
- Advanced RBAC
- Audit compliance reports

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bosdb
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bosdb
  template:
    spec:
      containers:
      - name: bosdb
        image: bosdb:latest
        env:
        - name: ENCRYPTION_MASTER_KEY
          valueFrom:
            secretKeyRef:
              name: bosdb-secrets
              key: encryption-key
```

### Environment Variables

```bash
# Required
ENCRYPTION_MASTER_KEY=<secret>

# Optional
DATABASE_URL=postgresql://...  # For app metadata
REDIS_URL=redis://...          # For caching
NODE_ENV=production
PORT=3000
```

## Monitoring & Observability

### Metrics

- Query execution time (p50, p95, p99)
- Connection pool utilization
- API request rate
- Error rate by endpoint
- Active connections count

### Logging

- Structured JSON logs
- User context in all queries
- Slow query tracking (>5s)
- Error stack traces
- Audit trail for all operations

### Alerts

- High error rate (>5%)
- Connection pool exhaustion
- Query timeout spike
- Memory/CPU threshold
- SSL certificate expiration

## Conclusion

BosDB is architected as a production-grade, scalable database management platform with:

- **Security-first design** with AES-256 encryption and SQL injection protection
- **Extensible architecture** via adapter pattern for multiple databases
- **Horizontal scalability** to support 10k+ concurrent users
- **Modern UX** with Monaco editor and real-time feedback
- **Enterprise-ready** with audit logging and compliance support

The system is ready for deployment with proper environment configuration and can scale horizontally to meet growing demands.
