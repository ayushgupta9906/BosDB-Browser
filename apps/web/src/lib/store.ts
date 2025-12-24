// Shared in-memory storage for connections and adapters
// With file-based persistence for development

import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.bosdb-connections.json');

// Load connections from file on startup
function loadConnections(): Map<string, any> {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
            const parsed = JSON.parse(data);
            console.log(`[Store] Loaded ${Object.keys(parsed).length} connections from file`);
            return new Map(Object.entries(parsed));
        }
    } catch (error) {
        console.error('[Store] Failed to load connections:', error);
    }
    return new Map();
}

// Save connections to file
export function saveConnections() {
    try {
        const obj = Object.fromEntries(connections);
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2));
        console.log(`[Store] Saved ${connections.size} connections to file`);
    } catch (error) {
        console.error('[Store] Failed to save connections:', error);
    }
}

export const connections = loadConnections();
export const adapterInstances = new Map<string, any>();
