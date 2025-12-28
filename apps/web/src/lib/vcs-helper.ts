/**
 * VCS Integration Helper
 * Automatically tracks database changes for version control
 */

export interface DatabaseChange {
    type: 'SCHEMA' | 'DATA';
    operation: 'CREATE' | 'ALTER' | 'DROP' | 'INSERT' | 'UPDATE' | 'DELETE';
    target: string;
    description: string;
    query?: string;
    tableName?: string;
    affectedRows?: number;
}

/**
 * Track a database change for version control
 */
export async function trackChange(connectionId: string, change: DatabaseChange): Promise<void> {
    try {
        await fetch('/api/vcs/pending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, change })
        });
    } catch (error) {
        console.error('Failed to track change:', error);
    }
}

/**
 * Track a schema change (CREATE, ALTER, DROP table)
 */
export async function trackSchemaChange(
    connectionId: string,
    operation: 'create' | 'alter' | 'drop',
    tableName: string,
    sql: string,
    author: { id: string; name: string }
): Promise<void> {
    const change: DatabaseChange = {
        type: 'SCHEMA',
        operation: operation.toUpperCase() as 'CREATE' | 'ALTER' | 'DROP',
        target: tableName,
        tableName,
        description: `${operation.charAt(0).toUpperCase() + operation.slice(1)} table ${tableName} by ${author.name}`,
        query: sql
    };

    await trackChange(connectionId, change);
}

/**
 * Parse SQL query to detect change type
 */
export function parseQueryForChanges(query: string, affectedRows?: number): DatabaseChange | null {
    const normalizedQuery = query.trim().toUpperCase();

    // Schema changes
    if (normalizedQuery.startsWith('CREATE TABLE')) {
        const match = query.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'SCHEMA',
            operation: 'CREATE',
            target: tableName,
            tableName,
            description: `Create table ${tableName}`,
            query
        };
    }

    if (normalizedQuery.startsWith('ALTER TABLE')) {
        const match = query.match(/ALTER\s+TABLE\s+([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'SCHEMA',
            operation: 'ALTER',
            target: tableName,
            tableName,
            description: `Alter table ${tableName}`,
            query
        };
    }

    if (normalizedQuery.startsWith('DROP TABLE')) {
        const match = query.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'SCHEMA',
            operation: 'DROP',
            target: tableName,
            tableName,
            description: `Drop table ${tableName}`,
            query
        };
    }

    // Data changes
    if (normalizedQuery.startsWith('INSERT INTO')) {
        const match = query.match(/INSERT\s+INTO\s+([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'DATA',
            operation: 'INSERT',
            target: tableName,
            tableName,
            description: `Insert ${affectedRows || 1} row(s) into ${tableName}`,
            query,
            affectedRows
        };
    }

    if (normalizedQuery.startsWith('UPDATE')) {
        const match = query.match(/UPDATE\s+([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'DATA',
            operation: 'UPDATE',
            target: tableName,
            tableName,
            description: `Update ${affectedRows || 'unknown'} row(s) in ${tableName}`,
            query,
            affectedRows
        };
    }

    if (normalizedQuery.startsWith('DELETE FROM')) {
        const match = query.match(/DELETE\s+FROM\s+([`"]?)(\w+)\1/i);
        const tableName = match ? match[2] : 'unknown';
        return {
            type: 'DATA',
            operation: 'DELETE',
            target: tableName,
            tableName,
            description: `Delete ${affectedRows || 'unknown'} row(s) from ${tableName}`,
            query,
            affectedRows
        };
    }

    return null;
}

/**
 * Get pending changes for a connection
 */
export async function getPendingChanges(connectionId: string): Promise<DatabaseChange[]> {
    try {
        const response = await fetch(`/api/vcs/pending?connectionId=${connectionId}`);
        const data = await response.json();
        return data.changes || [];
    } catch (error) {
        console.error('Failed to get pending changes:', error);
        return [];
    }
}

/**
 * Commit pending changes
 */
export async function commitChanges(
    connectionId: string,
    message: string,
    author: { name: string; email: string }
): Promise<boolean> {
    try {
        const pending = await getPendingChanges(connectionId);

        const response = await fetch('/api/vcs/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                connectionId,
                message,
                author,
                changes: pending,
                snapshot: {
                    schema: { tables: {} },
                    data: { tables: {} },
                    timestamp: new Date()
                }
            })
        });

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Failed to commit changes:', error);
        return false;
    }
}

/**
 * Get commit history for a connection
 */
export async function getCommitHistory(connectionId: string) {
    try {
        const response = await fetch(`/api/vcs/commit?connectionId=${connectionId}`);
        const data = await response.json();
        return data.commits || [];
    } catch (error) {
        console.error('Failed to get commit history:', error);
        return [];
    }
}

/**
 * Get branches for a connection
 */
export async function getBranches(connectionId: string) {
    try {
        const response = await fetch(`/api/vcs/branches?connectionId=${connectionId}`);
        const data = await response.json();
        return { branches: data.branches || [], currentBranch: data.currentBranch || 'main' };
    } catch (error) {
        console.error('Failed to get branches:', error);
        return { branches: [], currentBranch: 'main' };
    }
}

/**
 * Create a new branch
 */
export async function createBranch(connectionId: string, name: string): Promise<boolean> {
    try {
        const response = await fetch('/api/vcs/branches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, name, action: 'create' })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Failed to create branch:', error);
        return false;
    }
}

/**  
 * Checkout a branch
 */
export async function checkoutBranch(connectionId: string, name: string): Promise<boolean> {
    try {
        const response = await fetch('/api/vcs/branches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectionId, name, action: 'checkout' })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Failed to checkout branch:', error);
        return false;
    }
}
