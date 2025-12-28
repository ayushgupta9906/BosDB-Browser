import Docker from 'dockerode';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { DatabaseType, VALID_DATABASE_TYPES } from '@/constants/database-types';

const DATA_DIR = path.join(process.cwd(), '.bosdb-data');
const ORGS_DIR = path.join(DATA_DIR, 'orgs');

function getOrgDataDir(orgId: string): string {
    const orgDir = path.join(ORGS_DIR, orgId);
    if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir, { recursive: true });
    }
    return orgDir;
}

const docker = new Docker();

// DatabaseType and VALID_DATABASE_TYPES are imported from '@/constants/database-types'
// No longer re-exporting them here to prevent accidental client-side inclusion of this file.

export interface DockerDatabase {
    id: string;                    // Unique ID
    type: DatabaseType;
    name: string;                  // User-friendly name
    organizationId: string;        // Multi-tenant isolation
    containerId?: string;          // Docker container ID
    containerName: string;         // Docker container name
    port: number;                  // Exposed port
    username: string;              // Auto-generated
    password: string;              // Auto-generated
    database: string;              // Database name
    status: 'provisioning' | 'running' | 'stopped' | 'error';
    autoStart: boolean;            // Auto-start on BosDB startup
    createdAt: string;
    updatedAt: string;
}

// Database image configurations
const DB_IMAGES: Record<DatabaseType, { image: string; defaultPort: number }> = {
    postgres: { image: 'postgres:16-alpine', defaultPort: 5432 },
    mysql: { image: 'mysql:8-debian', defaultPort: 3306 },
    mariadb: { image: 'mariadb:11', defaultPort: 3306 },
    mssql: { image: 'mcr.microsoft.com/mssql/server:2022-latest', defaultPort: 1433 },
    oracle: { image: 'gvenzl/oracle-xe:21-slim', defaultPort: 1521 },
    firebird: { image: 'jacobalberty/firebird:latest', defaultPort: 3050 },
    cubrid: { image: 'cubrid/cubrid:latest', defaultPort: 33000 },
    duckdb: { image: 'duckdb/duckdb:latest', defaultPort: 0 }, // Embedded
    cockroachdb: { image: 'cockroachdb/cockroach:latest', defaultPort: 26257 },
    yugabyte: { image: 'yugabytedb/yugabyte:latest', defaultPort: 5433 },
    tidb: { image: 'pingcap/tidb:latest', defaultPort: 4000 },
    timescaledb: { image: 'timescale/timescaledb:latest-pg16', defaultPort: 5432 },
    sqlite: { image: 'nouchka/sqlite3:latest', defaultPort: 9999 },
    h2: { image: 'oscarfonts/h2:latest', defaultPort: 9092 },
    derby: { image: 'azarezis/derby:latest', defaultPort: 1527 },

    // NoSQL
    mongodb: { image: 'mongo:7', defaultPort: 27017 },
    couchbase: { image: 'couchbase/server:latest', defaultPort: 8091 },
    couchdb: { image: 'couchdb:3', defaultPort: 5984 },
    ferretdb: { image: 'ferretdb/ferretdb:latest', defaultPort: 27017 },
    cosmosdb: { image: 'mcr.microsoft.com/cosmosdb/linux/azure-cosmos-db-emulator:latest', defaultPort: 8081 },
    cassandra: { image: 'cassandra:5', defaultPort: 9042 },
    scylladb: { image: 'scylladb/scylla:latest', defaultPort: 9042 },
    redis: { image: 'redis:7-alpine', defaultPort: 6379 },
    memcached: { image: 'memcached:1.6-alpine', defaultPort: 11211 },
    rabbitmq: { image: 'rabbitmq:3.12-management-alpine', defaultPort: 5672 },
    minio: { image: 'minio/minio:latest', defaultPort: 9000 },
    surrealdb: { image: 'surrealdb/surrealdb:latest', defaultPort: 8000 },

    // Graph
    neo4j: { image: 'neo4j:5-community', defaultPort: 7687 },
    orientdb: { image: 'orientdb:latest', defaultPort: 2424 },

    // Search / Analytics
    elasticsearch: { image: 'elasticsearch:8.11.0', defaultPort: 9200 },
    opensearch: { image: 'opensearchproject/opensearch:latest', defaultPort: 9200 },
    solr: { image: 'solr:latest', defaultPort: 8983 },
    clickhouse: { image: 'clickhouse/clickhouse-server:latest', defaultPort: 8123 },
    influxdb: { image: 'influxdb:2.7-alpine', defaultPort: 8086 },
    prometheus: { image: 'prom/prometheus:latest', defaultPort: 9090 }
};

/**
 * Get Docker containers file path for organization
 */
function getContainersFilePath(orgId: string): string {
    const orgDir = getOrgDataDir(orgId);
    const dockerDir = path.join(orgDir, 'docker');
    if (!fs.existsSync(dockerDir)) {
        fs.mkdirSync(dockerDir, { recursive: true });
    }
    return path.join(dockerDir, 'containers.json');
}

/**
 * Load Docker databases for an organization
 */
export function loadDockerDatabases(orgId: string): DockerDatabase[] {
    try {
        const filePath = getContainersFilePath(orgId);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`[Docker] Failed to load databases for org ${orgId}:`, error);
    }
    return [];
}

/**
 * Save Docker databases for an organization
 */
function saveDockerDatabases(orgId: string, databases: DockerDatabase[]) {
    try {
        const filePath = getContainersFilePath(orgId);
        fs.writeFileSync(filePath, JSON.stringify(databases, null, 2));
    } catch (error) {
        console.error(`[Docker] Failed to save databases for org ${orgId}:`, error);
    }
}

/**
 * Generate secure random password
 */
function generatePassword(length: number = 16): string {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Generate secure random username
 */
function generateUsername(prefix: string = 'user'): string {
    return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
    const net = await import('net');
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close(() => {
                // Add a small delay to ensure OS releases the port
                setTimeout(() => resolve(true), 100);
            });
        });
        server.listen(port, '0.0.0.0');
    });
}

/**
 * Check if Docker is running
 */
export async function checkDockerAvailable(): Promise<boolean> {
    try {
        await docker.ping();
        return true;
    } catch (error) {
        console.error('[Docker] Docker is not running or not accessible:', error);
        return false;
    }
}

/**
 * Find available port starting from defaultPort
 */
/**
 * Find available port starting from defaultPort
 */
async function findAvailablePort(orgId: string, defaultPort: number): Promise<number> {
    const existing = loadDockerDatabases(orgId);
    // Ports known to the app
    const appUsedPorts = existing.map(db => db.port);

    // Ports actually used by Docker (source of truth)
    const containers = await docker.listContainers({ all: false });
    const dockerUsedPorts = containers.flatMap(c =>
        c.Ports.filter(p => p.PublicPort).map(p => p.PublicPort)
    );

    const usedPorts = [...new Set([...appUsedPorts, ...dockerUsedPorts])];

    let port = defaultPort;
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
        if (!usedPorts.includes(port)) {
            const available = await isPortAvailable(port);
            if (available) {
                console.log(`[Docker] Found available port: ${port}`);
                return port;
            }
        }
        port++;
        attempts++;
    }

    throw new Error(`Could not find available port after ${maxAttempts} attempts`);
}

/**
 * Pull Docker image if not exists
 */
async function pull(imageName: string, onProgress?: (message: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);

            if (onProgress) onProgress(`Pulling ${imageName}...`);

            docker.modem.followProgress(stream, (err: Error | null, _result: any[]) => {
                if (err) return reject(err);
                if (onProgress) onProgress(`Image ${imageName} pulled successfully`);
                resolve();
            }, (event: any) => {
                if (onProgress && event.status) {
                    onProgress(`${event.status}${event.progress || ''}`);
                }
            });
        });
    });
}

/**
 * Create and start a Docker database container
 */
export async function pullAndStartDatabase(
    type: DatabaseType,
    name: string,
    orgId: string,
    autoStart: boolean = true,
    onProgress?: (message: string) => void
): Promise<DockerDatabase> {
    // Check Docker availability
    const isAvailable = await checkDockerAvailable();
    if (!isAvailable) {
        throw new Error('Docker is not running. Please start Docker and try again.');
    }

    const config = DB_IMAGES[type];
    const port = await findAvailablePort(orgId, config.defaultPort);
    const username = generateUsername('bosdb');
    const password = generatePassword(20);
    const database = 'bosdb';
    const containerName = `bosdb-${orgId}-${type}-${Date.now()}`;

    // Create database record
    const dbRecord: DockerDatabase = {
        id: crypto.randomUUID(),
        type,
        name,
        organizationId: orgId,
        containerName,
        port,
        username,
        password,
        database,
        status: 'provisioning',
        autoStart,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let currentPort = port;
    let attempts = 0;
    const maxRetries = 5;

    // Pull image once (outside retry loop to save time)
    try {
        onProgress?.(`Pulling ${config.image}...`);
        await pullImage(config.image, onProgress);
    } catch (error) {
        console.error('[Docker] Failed to pull image:', error);
        throw error;
    }

    while (attempts < maxRetries) {
        try {
            // Create container with appropriate environment
            const env = getEnvironmentVars(type, username, password, database);

            onProgress?.(`Creating container ${containerName} (Port ${currentPort})...`);

            const container = await docker.createContainer({
                Image: config.image,
                name: containerName,
                Env: env,
                ExposedPorts: {
                    [`${config.defaultPort}/tcp`]: {}
                },
                HostConfig: {
                    PortBindings: {
                        [`${config.defaultPort}/tcp`]: [{ HostPort: currentPort.toString() }]
                    },
                    AutoRemove: false
                }
            });

            dbRecord.containerId = container.id;
            dbRecord.port = currentPort; // Update record with successful port

            // Start container
            onProgress?.(`Starting container...`);
            await container.start();

            // Wait for container to be ready, max 30 seconds
            onProgress?.(`Waiting for database to be ready...`);
            await waitForContainer(container, currentPort, 30000);

            dbRecord.status = 'running';
            dbRecord.updatedAt = new Date().toISOString();

            // Save to database list
            const databases = loadDockerDatabases(orgId);
            databases.push(dbRecord);
            saveDockerDatabases(orgId, databases);

            onProgress?.(`✅ Database ${name} is ready!`);
            console.log(`[Docker] Created ${type} database for org ${orgId}: ${containerName}`);

            return dbRecord;

        } catch (error: any) {
            // Check for port allocation error
            const isPortError = error.message?.includes('port is already allocated') ||
                error.message?.includes('Bind for') ||
                error.statusCode === 500;

            if (isPortError && attempts < maxRetries - 1) {
                console.log(`[Docker] Port ${currentPort} failed, retrying with next available port...`);

                // Clean up failed container if it was created (id exists) but start failed
                if (dbRecord.containerId) {
                    try {
                        const c = docker.getContainer(dbRecord.containerId);
                        await c.remove({ v: true, force: true });
                    } catch (e) { /* ignore cleanup error */ }
                    dbRecord.containerId = undefined; // Reset ID for next attempt
                }

                // Find next available port starting from current + 1
                currentPort = await findAvailablePort(orgId, currentPort + 1);
                attempts++;
                onProgress?.(`Port conflict. Retrying on port ${currentPort}...`);
                continue;
            }

            dbRecord.status = 'error';
            console.error('[Docker] Failed to create database:', error);
            throw error;
        }
    }

    throw new Error('Failed to provision database after multiple attempts.');
}


/**
 * Get environment variables for database type
 */
function getEnvironmentVars(type: DatabaseType, username: string, password: string, database: string): string[] {
    switch (type) {
        case 'postgres':
        case 'timescaledb':
            return [
                `POSTGRES_USER=${username}`,
                `POSTGRES_PASSWORD=${password}`,
                `POSTGRES_DB=${database}`
            ];
        case 'mysql':
        case 'tidb':
            return [
                `MYSQL_ROOT_PASSWORD=${password}`,
                `MYSQL_DATABASE=${database}`,
                `MYSQL_USER=${username}`,
                `MYSQL_PASSWORD=${password}`
            ];
        case 'mariadb':
            return [
                `MARIADB_ROOT_PASSWORD=${password}`,
                `MARIADB_DATABASE=${database}`,
                `MARIADB_USER=${username}`,
                `MARIADB_PASSWORD=${password}`
            ];
        case 'mongodb':
        case 'ferretdb':
            return [
                `MONGO_INITDB_ROOT_USERNAME=${username}`,
                `MONGO_INITDB_ROOT_PASSWORD=${password}`,
                `MONGO_INITDB_DATABASE=${database}`
            ];
        case 'redis':
            return [
                `REDIS_PASSWORD=${password}`
            ];
        case 'mssql':
            return [
                `ACCEPT_EULA=Y`,
                `MSSQL_SA_PASSWORD=${password}`,
                `MSSQL_PID=Developer`
            ];
        case 'oracle':
            return [
                `ORACLE_PASSWORD=${password}`,
                `APP_USER=${username}`,
                `APP_USER_PASSWORD=${password}`
            ];
        case 'influxdb':
            return [
                `DOCKER_INFLUXDB_INIT_MODE=setup`,
                `DOCKER_INFLUXDB_INIT_USERNAME=${username}`,
                `DOCKER_INFLUXDB_INIT_PASSWORD=${password}`,
                `DOCKER_INFLUXDB_INIT_ORG=bosdb`,
                `DOCKER_INFLUXDB_INIT_BUCKET=${database}`
            ];
        case 'neo4j':
            return [
                `NEO4J_AUTH=${username}/${password}`
            ];
        case 'clickhouse':
            return [
                `CLICKHOUSE_USER=${username}`,
                `CLICKHOUSE_PASSWORD=${password}`,
                `CLICKHOUSE_DB=${database}`
            ];
        case 'rabbitmq':
            return [
                `RABBITMQ_DEFAULT_USER=${username}`,
                `RABBITMQ_DEFAULT_PASS=${password}`
            ];
        case 'minio':
            return [
                `MINIO_ROOT_USER=${username}`,
                `MINIO_ROOT_PASSWORD=${password}`
            ];
        case 'surrealdb':
            return [
                `SURREAL_USER=${username}`,
                `SURREAL_PASS=${password}`
            ];
        case 'cockroachdb':
            return [
                `COCKROACH_USER=${username}`,
                `COCKROACH_PASSWORD=${password}`
            ];
        case 'scylladb':
        case 'cassandra':
            return [
                `CASSANDRA_CLUSTER_NAME=BosDB_Cluster`,
                `CASSANDRA_DC=dc1`
            ];
        case 'elasticsearch':
        case 'opensearch':
            return [
                `discovery.type=single-node`,
                `ELASTIC_PASSWORD=${password}`,
                `xpack.security.enabled=false`
            ];
        case 'couchdb':
            return [
                `COUCHDB_USER=${username}`,
                `COUCHDB_PASSWORD=${password}`
            ];
        case 'couchbase':
        case 'cosmosdb':
        case 'memcached':
        case 'prometheus':
        case 'solr':
        case 'orientdb':
        case 'firebird':
        case 'cubrid':
        case 'duckdb':
        case 'yugabyte':
        case 'sqlite':
        case 'h2':
        case 'derby':
            return []; // These either don't need auth or have different setup
        default:
            return [];
    }
}

/**
 * Pull Docker image
 */
async function pullImage(imageName: string, onProgress?: (message: string) => void): Promise<void> {
    // Check if image exists
    const images = await docker.listImages({ filters: { reference: [imageName] } });
    if (images.length > 0) {
        onProgress?.(`Image ${imageName} already exists`);
        return;
    }

    // Pull image
    await pullDockerImage(imageName, onProgress);
}

/**
 * Wait for container to be ready
 */
/**
 * Wait for a port to be open (accepting connections)
 */
async function waitForPortOpen(port: number, timeoutMs: number): Promise<boolean> {
    const net = await import('net');
    const startTime = Date.now();
    const checkInterval = 200;

    while (Date.now() - startTime < timeoutMs) {
        const isOpen = await new Promise<boolean>((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(500); // 500ms connect timeout

            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                socket.destroy();
                resolve(false);
            });

            socket.connect(port, '0.0.0.0');
        });

        if (isOpen) return true;
        await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    return false;
}

/**
 * Wait for container to be ready
 */
async function waitForContainer(container: Docker.Container, port: number, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    let isRunning = false;

    // 1. Wait for container to be in 'running' state
    while (Date.now() - startTime < timeoutMs) {
        const info = await container.inspect();
        if (info.State.Running) {
            isRunning = true;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!isRunning) {
        throw new Error('Container failed to start (Docker state)');
    }

    // 2. Wait for the database port to be ready (TCP connect)
    // Most DBs need a moment after 'running' to actually bind the port
    const remainingTime = timeoutMs - (Date.now() - startTime);
    const isReady = await waitForPortOpen(port, remainingTime > 0 ? remainingTime : 5000);

    if (!isReady) {
        // Even if port check fails, we give it a final small buffer just in case
        // (some UDP-based or complex DBs might behave differently)
        console.warn(`[Docker] Port ${port} check timed out, proceeding anyway...`);
        return;
    }
}

/**
 * Stop a Docker database
 */
export async function stopDatabase(id: string, orgId: string): Promise<void> {
    const databases = loadDockerDatabases(orgId);
    const db = databases.find(d => d.id === id);

    if (!db || !db.containerId) {
        throw new Error('Database not found');
    }

    const container = docker.getContainer(db.containerId);
    await container.stop();

    db.status = 'stopped';
    db.updatedAt = new Date().toISOString();
    saveDockerDatabases(orgId, databases);

    console.log(`[Docker] Stopped database ${db.name} for org ${orgId}`);
}

/**
 * Start a Docker database
 */
export async function startDatabase(id: string, orgId: string): Promise<void> {
    const databases = loadDockerDatabases(orgId);
    const db = databases.find(d => d.id === id);

    if (!db || !db.containerId) {
        throw new Error('Database not found');
    }

    const container = docker.getContainer(db.containerId);
    await container.start();

    db.status = 'running';
    db.updatedAt = new Date().toISOString();
    saveDockerDatabases(orgId, databases);

    console.log(`[Docker] Started database ${db.name} for org ${orgId}`);
}

/**
 * Remove a Docker database (container and data)
 */
export async function removeDatabase(id: string, orgId: string): Promise<void> {
    const databases = loadDockerDatabases(orgId);
    const db = databases.find(d => d.id === id);

    if (!db || !db.containerId) {
        throw new Error('Database not found');
    }

    const container = docker.getContainer(db.containerId);

    // Stop if running
    try {
        await container.stop();
    } catch (error) {
        // Already stopped
    }

    // Remove container
    await container.remove({ v: true }); // Remove volumes too

    // Remove from database list
    const updated = databases.filter(d => d.id !== id);
    saveDockerDatabases(orgId, updated);

    console.log(`[Docker] Removed database ${db.name} for org ${orgId}`);
}

/**
 * Get container logs
 */
export async function getContainerLogs(id: string, orgId: string, tail: number = 100): Promise<string> {
    const databases = loadDockerDatabases(orgId);
    const db = databases.find(d => d.id === id);

    if (!db || !db.containerId) {
        throw new Error('Database not found');
    }

    const container = docker.getContainer(db.containerId);
    const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail
    });

    return logs.toString();
}

/**
 * Update container status
 */
export async function updateContainerStatus(id: string, orgId: string): Promise<void> {
    const databases = loadDockerDatabases(orgId);
    const db = databases.find(d => d.id === id);

    if (!db || !db.containerId) {
        return;
    }

    try {
        const container = docker.getContainer(db.containerId);
        const info = await container.inspect();

        db.status = info.State.Running ? 'running' : 'stopped';
        db.updatedAt = new Date().toISOString();
        saveDockerDatabases(orgId, databases);
    } catch (error) {
        db.status = 'error';
        saveDockerDatabases(orgId, databases);
    }
}

// Helper function that was referenced but not defined
async function pullDockerImage(imageName: string, onProgress?: (message: string) => void): Promise<void> {
    return pull(imageName, onProgress);
}
