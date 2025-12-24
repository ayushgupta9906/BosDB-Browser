/**
 * Application-wide constants
 */

// Query Limits
export const DEFAULT_QUERY_TIMEOUT = 30000; // 30 seconds
export const MAX_QUERY_TIMEOUT = 300000; // 5 minutes
export const DEFAULT_MAX_ROWS = 1000;
export const MAX_ROWS_LIMIT = 100000;

// Connection Limits
export const DEFAULT_CONNECTION_TIMEOUT = 5000; // 5 seconds
export const DEFAULT_POOL_SIZE = 10;
export const MAX_POOL_SIZE = 50;
export const IDLE_TIMEOUT = 30000; // 30 seconds

// Rate Limits
export const RATE_LIMIT = {
    queriesPerMinute: 30,
    connectionsPerWorkspace: 10,
    maxConcurrentQueries: 5,
    savedQueriesPerWorkspace: 100,
} as const;

// Database Default Ports
export const DEFAULT_PORTS: Record<string, number> = {
    postgresql: 5432,
    mysql: 3306,
    mongodb: 27017,
};

// Export Format
export type ExportFormat = 'csv' | 'json' | 'sql';

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;
