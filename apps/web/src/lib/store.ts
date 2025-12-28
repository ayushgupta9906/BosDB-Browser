// Shared in-memory storage for connections and adapters
// With organization-scoped file-based persistence

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.bosdb-data');
const ORGS_DIR = path.join(DATA_DIR, 'orgs');

function getOrgDataDir(orgId: string): string {
    const orgDir = path.join(ORGS_DIR, orgId);
    if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir, { recursive: true });
    }
    return orgDir;
}

// Legacy file (for backward compatibility)
const LEGACY_STORAGE_FILE = path.join(process.cwd(), '.bosdb-connections.json');

// Get organization-specific connections file path
function getConnectionsFilePath(orgId: string): string {
    const orgDir = getOrgDataDir(orgId);
    return path.join(orgDir, 'connections.json');
}

// Load connections for a specific organization
function loadConnectionsByOrg(orgId: string): Map<string, any> {
    try {
        const filePath = getConnectionsFilePath(orgId);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(data);
            console.log(`[Store] Loaded ${Object.keys(parsed).length} connections for org ${orgId}`);
            return new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.error(`[Store] Failed to load connections for org ${orgId}:`, error);
    }
    return new Map();
}

// Load connections from legacy file (for backward compatibility)
function loadLegacyConnections(): Map<string, any> {
    try {
        if (fs.existsSync(LEGACY_STORAGE_FILE)) {
            const data = fs.readFileSync(LEGACY_STORAGE_FILE, 'utf-8');
            const parsed = JSON.parse(data);
            console.log(`[Store] Loaded ${Object.keys(parsed).length} connections from legacy file`);
            return new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.error('[Store] Failed to load legacy connections:', error);
    }
    return new Map();
}

// Save connections for a specific organization
export function saveConnectionsByOrg(orgId: string, connections: Map<string, any>) {
    try {
        const filePath = getConnectionsFilePath(orgId);
        const obj = Object.fromEntries(connections);
        fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
        console.log(`[Store] Saved ${connections.size} connections for org ${orgId}`);
    } catch (error) {
        console.error(`[Store] Failed to save connections for org ${orgId}:`, error);
    }
}

// Save connections to legacy file (for backward compatibility)
export function saveConnections() {
    try {
        const obj = Object.fromEntries(getConnections());
        fs.writeFileSync(LEGACY_STORAGE_FILE, JSON.stringify(obj, null, 2));
        console.log(`[Store] Saved ${getConnections().size} connections to legacy file`);
    } catch (error) {
        console.error('[Store] Failed to save connections:', error);
    }
}

// Organization-scoped connection and adapter caches
const _orgConnections: Map<string, Map<string, any>> = new Map();
const _orgAdapterInstances: Map<string, Map<string, any>> = new Map();

// Legacy single map (loads from legacy file)
let _legacyConnections: Map<string, any> | null = null;
let _legacyAdapterInstances: Map<string, any> | null = null;

// Get connections for a specific organization
export function getConnectionsByOrg(orgId: string): Map<string, any> {
    if (!_orgConnections.has(orgId)) {
        _orgConnections.set(orgId, loadConnectionsByOrg(orgId));
    }
    return _orgConnections.get(orgId)!;
}

// Get adapter instances for a specific organization
export function getAdapterInstancesByOrg(orgId: string): Map<string, any> {
    if (!_orgAdapterInstances.has(orgId)) {
        _orgAdapterInstances.set(orgId, new Map());
    }
    return _orgAdapterInstances.get(orgId)!;
}

// Legacy: Get all connections (from legacy file)
export function getConnections(): Map<string, any> {
    if (!_legacyConnections) {
        _legacyConnections = loadLegacyConnections();
    }
    return _legacyConnections;
}

// Legacy: Get all adapter instances
export function getAdapterInstances(): Map<string, any> {
    if (!_legacyAdapterInstances) {
        _legacyAdapterInstances = new Map();
    }
    return _legacyAdapterInstances;
}

// Clear organization cache (for refresh)
export function clearOrgCache(orgId: string) {
    _orgConnections.delete(orgId);
    _orgAdapterInstances.delete(orgId);
}

// Legacy exports for compatibility - these now use lazy loading with proper Map delegation
export const connections = new Proxy({} as Map<string, any>, {
    get(_target, prop) {
        const map = getConnections();
        const value = (map as any)[prop];
        // Bind methods to the actual Map instance
        if (typeof value === 'function') {
            return value.bind(map);
        }
        return value;
    },
    set(_target, prop, value) {
        (getConnections() as any)[prop] = value;
        return true;
    }
});

export const adapterInstances = new Proxy({} as Map<string, any>, {
    get(_target, prop) {
        const map = getAdapterInstances();
        const value = (map as any)[prop];
        // Bind methods to the actual Map instance
        if (typeof value === 'function') {
            return value.bind(map);
        }
        return value;
    },
    set(_target, prop, value) {
        (getAdapterInstances() as any)[prop] = value;
        return true;
    }
});
