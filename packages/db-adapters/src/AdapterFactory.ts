import type { DatabaseType } from '@bosdb/core';
import type { IDBAdapter } from './interfaces/IDBAdapter';
import { PostgreSQLAdapter } from './adapters/postgresql/PostgreSQLAdapter';

/**
 * Factory for creating database adapter instances
 */
export class AdapterFactory {
    /**
     * Create a database adapter instance based on type
     */
    static create(type: DatabaseType): IDBAdapter {
        switch (type) {
            case 'postgresql':
                return new PostgreSQLAdapter();

            case 'mysql':
                throw new Error('MySQL adapter not yet implemented');

            case 'mongodb':
                throw new Error('MongoDB adapter not yet implemented');

            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }

    /**
     * Get list of supported database types
     */
    static getSupportedTypes(): DatabaseType[] {
        return ['postgresql']; // Will expand as more adapters are implemented
    }
}
