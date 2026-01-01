
export function generateUpdateStatement(
    schema: string,
    table: string,
    primaryKey: { [key: string]: any },
    changes: { [key: string]: any },
    _dbType: string
): string {
    const setClauses: string[] = [];
    const values: any[] = [];

    // Safety check
    if (Object.keys(primaryKey).length === 0 || Object.keys(changes).length === 0) {
        throw new Error('Cannot generate UPDATE: Missing primary key or changes');
    }

    // Build SET clause
    for (const [col, val] of Object.entries(changes)) {
        if (val === null) {
            setClauses.push(`${col} = NULL`);
        } else if (typeof val === 'string') {
            // Simple escaping for MVP - in prod use parameterized queries
            setClauses.push(`${col} = '${val.replace(/'/g, "''")}'`);
        } else if (typeof val === 'number' || typeof val === 'boolean') {
            setClauses.push(`${col} = ${val}`);
        } else {
            // Objects/Arrays/Dates
            setClauses.push(`${col} = '${JSON.stringify(val).replace(/'/g, "''")}'`);
        }
    }

    // Build WHERE clause
    const whereClauses: string[] = [];
    for (const [col, val] of Object.entries(primaryKey)) {
        if (typeof val === 'string') {
            whereClauses.push(`${col} = '${val.replace(/'/g, "''")}'`);
        } else {
            whereClauses.push(`${col} = ${val}`);
        }
    }

    const setClause = setClauses.join(', ');
    const whereClause = whereClauses.join(' AND ');

    return `UPDATE ${schema}.${table} SET ${setClause} WHERE ${whereClause};`;
}

export function detectPrimaryKey(fields: { name: string, dataType: string }[]): string[] {
    // Naive heuristic for MVP since we don't have direct metadata access in result set yet

    // 1. Look for 'id', 'ID', 'Id'
    const idField = fields.find(f => f.name.toLowerCase() === 'id');
    if (idField) return [idField.name];

    // 2. Look for 'table_id' style
    const typeIdField = fields.find(f => f.name.toLowerCase().endsWith('_id'));
    if (typeIdField) return [typeIdField.name];

    // 3. Fallback: First column is often PK
    if (fields.length > 0) return [fields[0].name];

    return [];
}

export function extractTableName(query: string): string | null {
    // Basic regex to find FROM clause
    // Matches: FROM table | FROM schema.table | FROM "table"
    const match = query.match(/\bfrom\s+([a-zA-Z0-9_."]+)/i);
    if (match && match[1]) {
        // Strip quotes and return simple table name (ignoring schema for now if present)
        const parts = match[1].replace(/["`]/g, '').split('.');
        return parts[parts.length - 1];
    }
    return null;
}

export interface ColumnDef {
    name: string;
    type: string; // e.g., 'VARCHAR', 'INTEGER', 'BOOLEAN'
    isPrimaryKey: boolean;
    isNullable: boolean;
    defaultValue?: string;
}

export interface TableDef {
    name: string;
    columns: ColumnDef[];
}

export function generateCreateTableSQL(tableDef: TableDef, schema: string = 'public'): string {
    if (!tableDef.name) throw new Error('Table name is required');
    if (!tableDef.columns || tableDef.columns.length === 0) throw new Error('At least one column is required');

    const columnDefinitions = tableDef.columns.map(col => {
        const parts = [`"${col.name}"`, col.type];

        if (col.isPrimaryKey) {
            parts.push('PRIMARY KEY');
        }

        if (!col.isNullable && !col.isPrimaryKey) {
            parts.push('NOT NULL');
        }

        if (col.defaultValue) {
            // Basic heuristic for default value quoting
            const isNumber = !isNaN(Number(col.defaultValue));
            const isFunction = col.defaultValue.toUpperCase().endsWith('()'); // e.g., NOW()

            if (isNumber || isFunction) {
                parts.push(`DEFAULT ${col.defaultValue}`);
            } else {
                parts.push(`DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`);
            }
        }

        return parts.join(' ');
    });

    return `CREATE TABLE "${schema}"."${tableDef.name}" (\n    ${columnDefinitions.join(',\n    ')}\n);`;
}
