import Docker from 'dockerode';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getOrgDataDir } from './organization';

const docker = new Docker();

export type DatabaseType = 'postgres' | 'mysql' | 'mongodb' | 'redis';

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
    mongodb: { image: 'mongo:7', defaultPort: 27017 },
    redis: { image: 'redis:7-alpine', defaultPort: 6379 }
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
            server.close();
            resolve(true);
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
async function findAvailablePort(orgId: string, defaultPort: number): Promise<number> {
    const existing = loadDockerDatabases(orgId);
    const usedPorts = existing.map(db => db.port);
    
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
        docker.pull(imageName, (err: Error | undefined, stream: NodeJS.ReadableStream) => {
            if (err) return reject(err);

            if (onProgress) onProgress(`Pulling ${imageName}...`);

            docker.modem.followProgress(stream, (err: Error | undefined) => {
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

    try {
        // Pull image
        onProgress?.(`Pulling ${config.image}...`);
        await pullImage(config.image, onProgress);

        // Create container with appropriate environment
        const env = getEnvironmentVars(type, username, password, database);

        onProgress?.(`Creating container ${containerName}...`);
        const container = await docker.createContainer({
            Image: config.image,
            name: containerName,
            Env: env,
            ExposedPorts: {
                [`${config.defaultPort}/tcp`]: {}
            },
            HostConfig: {
                PortBindings: {
                    [`${config.defaultPort}/tcp`]: [{ HostPort: port.toString() }]
                },
                AutoRemove: false
            }
        });

        dbRecord.containerId = container.id;

        // Start container
        onProgress?.(`Starting container...`);
        await container.start();

        // Wait for container to be healthy
        onProgress?.(`Waiting for database to be ready...`);
        await waitForContainer(container, 30000); // 30 second timeout

        dbRecord.status = 'running';
        dbRecord.updatedAt = new Date().toISOString();

        // Save to database list
        const databases = loadDockerDatabases(orgId);
        databases.push(dbRecord);
        saveDockerDatabases(orgId, databases);

        onProgress?.(`✅ Database ${name} is ready!`);
        console.log(`[Docker] Created ${type} database for org ${orgId}: ${containerName}`);

        return dbRecord;
    } catch (error) {
        dbRecord.status = 'error';
        console.error('[Docker] Failed to create database:', error);
        throw error;
    }
}

/**
 * Get environment variables for database type
 */
function getEnvironmentVars(type: DatabaseType, username: string, password: string, database: string): string[] {
    switch (type) {
        case 'postgres':
            return [
                `POSTGRES_USER=${username}`,
                `POSTGRES_PASSWORD=${password}`,
                `POSTGRES_DB=${database}`
            ];
        case 'mysql':
            return [
                `MYSQL_ROOT_PASSWORD=${password}`,
                `MYSQL_DATABASE=${database}`,
                `MYSQL_USER=${username}`,
                `MYSQL_PASSWORD=${password}`
            ];
        case 'mongodb':
            return [
                `MONGO_INITDB_ROOT_USERNAME=${username}`,
                `MONGO_INITDB_ROOT_PASSWORD=${password}`,
                `MONGO_INITDB_DATABASE=${database}`
            ];
        case 'redis':
            return [
                `REDIS_PASSWORD=${password}`
            ];
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
async function waitForContainer(container: Docker.Container, timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const info = await container.inspect();
        if (info.State.Running) {
            // Give it a bit more time to initialize
            await new Promise(resolve => setTimeout(resolve, 2000));
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error('Container failed to start within timeout');
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
