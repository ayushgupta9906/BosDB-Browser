/**
 * Commit represents a snapshot of database state at a point in time
 */
export interface Commit {
    /** Unique commit identifier (SHA-like hash) */
    id: string;

    /** Parent commit IDs (array for merge commits) */
    parentIds: string[];

    /** Commit message describing changes */
    message: string;

    /** Author of the commit */
    author: string;

    /** Timestamp when commit was created */
    timestamp: Date;

    /** Reference to schema snapshot */
    schemaSnapshotId: string;

    /** Reference to data snapshot */
    dataSnapshotId: string;

    /** Branch this commit belongs to */
    branch: string;

    /** Optional tags for this commit */
    tags?: string[];
}

/**
 * SchemaSnapshot captures the database schema at a point in time
 */
export interface SchemaSnapshot {
    id: string;
    connectionId: string;
    timestamp: Date;
    tables: TableSchema[];
    views?: ViewSchema[];
    indexes?: IndexSchema[];
    constraints?: ConstraintSchema[];
}

export interface TableSchema {
    name: string;
    schema?: string;
    columns: ColumnSchema[];
    primaryKeys: string[];
    foreignKeys: ForeignKeySchema[];
}

export interface ColumnSchema {
    name: string;
    dataType: string;
    nullable: boolean;
    defaultValue?: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
}

export interface ForeignKeySchema {
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
}

export interface ViewSchema {
    name: string;
    definition: string;
}

export interface IndexSchema {
    name: string;
    tableName: string;
    columns: string[];
    unique: boolean;
}

export interface ConstraintSchema {
    name: string;
    type: 'CHECK' | 'UNIQUE' | 'PRIMARY KEY' | 'FOREIGN KEY';
    definition: string;
}

/**
 * DataSnapshot captures a subset or full data at a point in time
 */
export interface DataSnapshot {
    id: string;
    connectionId: string;
    timestamp: Date;
    /** Storage path to compressed data file */
    storageId: string;
    /** Metadata about the snapshot */
    metadata: {
        totalRows: number;
        totalSize: number;
        compressed: boolean;
        format: 'full' | 'delta';
    };
}

/**
 * CommitOptions for creating new commits
 */
export interface CommitOptions {
    message: string;
    author: string;
    connectionId: string;
    includeTables?: string[];
    excludeTables?: string[];
}

/**
 * CommitMetadata for storing commit information
 */
export interface CommitMetadata {
    commit: Commit;
    stats: {
        filesChanged: number;
        insertions: number;
        deletions: number;
        executionTime: number;
    };
}
