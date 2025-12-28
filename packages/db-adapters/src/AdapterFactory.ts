import type { DatabaseType } from '@bosdb/core';
import type { IDBAdapter } from './interfaces/IDBAdapter';
import { PostgreSQLAdapter } from './adapters/postgresql/PostgreSQLAdapter';
import { MySQLAdapter } from './adapters/mysql/MySQLAdapter';
import { MongoDBAdapter } from './adapters/mongodb/MongoDBAdapter';
import { RedisAdapter } from './adapters/redis/RedisAdapter';

/**
 * Factory for creating database adapter instances
 */
export class AdapterFactory {
    /**
     * Create a database adapter instance based on the database type
     * @param type Database type ('postgresql', 'mysql', 'mongodb', 'redis', 'mariadb', etc.)
     * @returns Database adapter instance
     */
    static create(type: string): IDBAdapter {
        switch (type.toLowerCase()) {
            case 'postgresql':
            case 'postgres':
                return new PostgreSQLAdapter();

            case 'mysql':
                return new MySQLAdapter();

            case 'mariadb':
                // MariaDB is MySQL-compatible, use MySQL adapter
                return new MySQLAdapter();

            case 'mongodb':
            case 'mongo':
                return new MongoDBAdapter();

            case 'redis':
                return new RedisAdapter();

            default:
                throw new Error(`Unsupported database type: ${type}`);
        }
    }

    /**
     * Get list of supported database types
     */
    static getSupportedTypes(): DatabaseType[] {
        return ['postgresql', 'mysql', 'mariadb', 'mongodb', 'redis'];
    }
}
