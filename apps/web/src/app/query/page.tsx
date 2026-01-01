'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Play, Save, Download, Clock, Table as TableIcon, Database, ChevronRight, ChevronDown, GitBranch, Plus as PlusIcon, FileCode, Wand2, FileSearch, FileStack, Upload, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { trackChange, parseQueryForChanges, getPendingChanges } from '@/lib/vcs-helper';
import { extractTableName } from '@/lib/sql-helper';
import { formatSQL, getDialectFromDbType, getExplainPrefix } from '@/lib/sql-formatter';
import TableDesigner from '@/components/schema/TableDesigner';
import { SaveQueryModal } from '@/components/SaveQueryModal';
import { ExportModal } from '@/components/ExportModal';
import { ImportModal } from '@/components/ImportModal';
import { SQLTemplateModal } from '@/components/SQLTemplateModal';
import { TableContextMenu } from '@/components/TableContextMenu';
import { QueryPlanViewer } from '@/components/QueryPlanViewer';
import { ResultsToolbar } from '@/components/ResultsToolbar';
import { DataEditor } from '@/components/DataEditor';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';

// Define QueryResult interface
interface QueryResult {
    success: boolean;
    rows: any[];
    fields: { name: string; dataType: string }[];
    rowCount: number;
    executionTime: number;
    hasMore?: boolean;
}

interface TableInfo {
    name: string;
    type: string;
    rowCount?: number;
}

// Comprehensive query syntax validation for all database types
function validateQuerySyntax(query: string, dbType: string): string {
    const lowerQuery = query.toLowerCase();
    const warnings: string[] = [];

    if (dbType === 'postgresql') {
        // PostgreSQL-specific validations
        if (lowerQuery.includes('auto_increment')) {
            warnings.push('AUTO_INCREMENT → Use SERIAL or BIGSERIAL instead');
        }
        if (lowerQuery.match(/\bint\s+auto_increment/i)) {
            warnings.push('INT AUTO_INCREMENT → Use SERIAL PRIMARY KEY');
        }
        if (lowerQuery.includes('tinyint')) {
            warnings.push('TINYINT → Use SMALLINT or BOOLEAN instead');
        }
        if (lowerQuery.match(/\bvarchar\(\d+\)/)) {
            // This is fine, but suggest TEXT for large strings
            if (!lowerQuery.includes('text')) {
                const match = lowerQuery.match(/varchar\((\d+)\)/);
                if (match && parseInt(match[1]) > 1000) {
                    warnings.push('VARCHAR(>1000) → Consider using TEXT type');
                }
            }
        }
        if (lowerQuery.includes('datetime')) {
            warnings.push('DATETIME → PostgreSQL uses TIMESTAMP');
        }
        if (lowerQuery.includes('double')) {
            warnings.push('DOUBLE → Use DOUBLE PRECISION or NUMERIC');
        }
        if (lowerQuery.includes('mediumtext') || lowerQuery.includes('longtext')) {
            warnings.push('MEDIUMTEXT/LONGTEXT → Use TEXT in PostgreSQL');
        }
    }

    if (dbType === 'mysql' || dbType === 'mariadb') {
        // MySQL/MariaDB-specific validations
        if (lowerQuery.includes('serial')) {
            warnings.push('SERIAL → Use AUTO_INCREMENT instead');
        }
        if (lowerQuery.match(/\bboolean\b/)) {
            warnings.push('BOOLEAN → Use TINYINT(1) in MySQL');
        }
        if (lowerQuery.includes('bigserial')) {
            warnings.push('BIGSERIAL → Use BIGINT AUTO_INCREMENT');
        }
        if (lowerQuery.match(/\btimestamp\b/) && !lowerQuery.includes('default')) {
            warnings.push('TIMESTAMP should have DEFAULT CURRENT_TIMESTAMP');
        }
        if (lowerQuery.match(/\btext\b/) && !lowerQuery.includes('longtext') && !lowerQuery.includes('mediumtext')) {
            warnings.push('TEXT in MySQL is limited to 65KB. Consider MEDIUMTEXT or LONGTEXT');
        }
        if (lowerQuery.includes('double precision')) {
            warnings.push('DOUBLE PRECISION → Use DOUBLE in MySQL');
        }
        if (lowerQuery.includes('smallserial')) {
            warnings.push('SMALLSERIAL → Use SMALLINT AUTO_INCREMENT');
        }
    }

    if (dbType === 'mongodb') {
        // MongoDB-specific validations
        if (lowerQuery.includes('select') || lowerQuery.includes('insert') || lowerQuery.includes('create')) {
            warnings.push('MongoDB uses JSON format, not SQL! Example: {"find": "collection", "filter": {}}');
        }

        // Check if valid JSON
        try {
            const parsed = JSON.parse(query);

            // Validate MongoDB query structure
            if (!parsed.find && !parsed.aggregate && !parsed.insert && !parsed.update && !parsed.delete) {
                warnings.push('MongoDB query must have: find, aggregate, insert, update, or delete');
            }

            // Check for common mistakes
            if (parsed.find && !parsed.filter && Object.keys(parsed).length === 1) {
                warnings.push('Tip: Add "filter" field for query conditions. Example: {"find": "users", "filter": {"age": {"$gt": 18}}}');
            }
        } catch (e) {
            warnings.push('Invalid JSON format! MongoDB queries must be valid JSON');
        }
    }

    if (dbType === 'redis') {
        // Redis-specific validations
        if (lowerQuery.includes('select') || lowerQuery.includes('insert') || lowerQuery.includes('create')) {
            warnings.push('Redis uses JSON format, not SQL! Example: {"command": "GET", "args": ["mykey"]}');
        }

        // Check if valid JSON
        try {
            const parsed = JSON.parse(query);

            if (!parsed.command) {
                warnings.push('Redis query must have "command" field. Example: {"command": "KEYS", "args": ["*"]}');
            }
        } catch (e) {
            warnings.push('Invalid JSON format! Redis queries must be valid JSON');
        }
    }

    // Common validations for SQL databases
    if (dbType === 'postgresql' || dbType === 'mysql' || dbType === 'mariadb') {
        // Check for missing semicolon at end (optional but good practice)
        if (!query.trim().endsWith(';') && !query.trim().endsWith('}')) {
            // This is just a tip, not critical
        }

        // Warn about SELECT * in production
        if (lowerQuery.includes('select *') && !lowerQuery.includes('limit')) {
            warnings.push('Tip: Consider adding LIMIT clause to SELECT * queries');
        }

        // Check for DROP without IF EXISTS
        if (lowerQuery.includes('drop table') && !lowerQuery.includes('if exists')) {
            warnings.push('Safety: Consider using DROP TABLE IF EXISTS');
        }
    }

    // Return formatted warning message
    if (warnings.length === 0) {
        return '';
    }

    if (warnings.length === 1) {
        return `⚠️ ${warnings[0]}`;
    }

    return `⚠️ Syntax Warnings:\n${warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
}

function QueryPageContent() {
    const searchParams = useSearchParams();
    const connectionId = searchParams?.get('connection');
    const { theme } = useTheme();

    const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 10;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [connectionInfo, setConnectionInfo] = useState<any>(null);
    const [schemas, setSchemas] = useState<any[]>([]);
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['public']));
    const [schemaTables, setSchemaTables] = useState<Map<string, TableInfo[]>>(new Map());
    const [schemaProcedures, setSchemaProcedures] = useState<Map<string, any[]>>(new Map());
    const [pendingChanges, setPendingChanges] = useState<number>(0);
    const [editorRef, setEditorRef] = useState<any>(null);
    const [showTableDesigner, setShowTableDesigner] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showQueryPlan, setShowQueryPlan] = useState(false);
    const [queryPlan, setQueryPlan] = useState<any>(null);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        tableName: string;
        schemaName: string;
    } | null>(null);
    const [importTable, setImportTable] = useState<{ name: string; schema: string } | null>(null);

    // Loading states map: schemaName -> { tables: boolean, procedures: boolean }
    const [loadingResources, setLoadingResources] = useState<Map<string, { tables: boolean; procedures: boolean }>>(new Map());
    const [resourceErrors, setResourceErrors] = useState<Map<string, string>>(new Map());

    // Memoize columns to prevent infinite loop in ResultsToolbar
    const columns = useMemo(() => result ? result.fields.map(f => f.name) : [], [result]);

    const updateLoading = (schema: string, type: 'tables' | 'procedures', isLoading: boolean) => {
        setLoadingResources(prev => {
            const next = new Map(prev);
            const current = next.get(schema) || { tables: false, procedures: false };
            next.set(schema, { ...current, [type]: isLoading });
            return next;
        });
    };

    const handleRefresh = async () => {
        setSchemas([]);
        setSchemaTables(new Map());
        setSchemaProcedures(new Map());
        setExpandedSchemas(new Set());
        setLoadingResources(new Map());
        setResourceErrors(new Map());
        await fetchSchemas();
        await loadPendingChanges();
    };

    // Format SQL handler
    const handleFormatSQL = () => {
        if (!query.trim() || !connectionInfo) return;
        const dialect = getDialectFromDbType(connectionInfo.type);
        const formatted = formatSQL(query, { dialect });
        setQuery(formatted);
    };

    // Explain Query handler
    const handleExplainQuery = async () => {
        if (!connectionId || !query.trim() || !connectionInfo) return;

        setExecuting(true);
        setError('');

        try {
            const explainPrefix = getExplainPrefix(connectionInfo.type);
            const explainQuery = explainPrefix + query.trim().replace(/;$/, '');

            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    query: explainQuery,
                    timeout: 30000,
                    maxRows: 1000,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'EXPLAIN failed');
            }

            // Parse the plan from result
            let plan = data.rows;
            if (connectionInfo.type === 'postgresql' && data.rows?.[0]?.['QUERY PLAN']) {
                plan = data.rows[0]['QUERY PLAN'];
            }

            setQueryPlan(plan);
            setShowQueryPlan(true);
        } catch (err: any) {
            setError(`EXPLAIN failed: ${err.message}`);
        } finally {
            setExecuting(false);
        }
    };

    // Handle table right-click
    const handleTableContextMenu = (e: React.MouseEvent, tableName: string, schemaName: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tableName, schemaName });
    };



    useEffect(() => {
        if (connectionId) {
            fetchConnectionInfo();
            fetchSchemas();
            loadPendingChanges();
        }
    }, [connectionId]);

    const loadPendingChanges = async () => {
        if (!connectionId) return;
        const changes = await getPendingChanges(connectionId);
        setPendingChanges(changes.length);
    };

    const fetchConnectionInfo = async () => {
        try {
            const res = await fetch('/api/connections');
            const data = await res.json();
            const conn = data.connections?.find((c: any) => c.id === connectionId);
            setConnectionInfo(conn);
        } catch (err) {
            console.error('Failed to fetch connection info:', err);
        }
    };

    const fetchSchemas = async () => {
        try {
            const res = await fetch(`/api/schema?connectionId=${connectionId}`);
            const data = await res.json();
            setSchemas(data.schemas || []);
        } catch (err) {
            console.error('Failed to fetch schemas:', err);
        }
    };

    const fetchTables = async (schemaName: string) => {
        updateLoading(schemaName, 'tables', true);
        try {
            const res = await fetch(`/api/tables?connectionId=${connectionId}&schema=${schemaName}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch tables');
            setSchemaTables(prev => new Map(prev).set(schemaName, data.tables || []));
        } catch (err: any) {
            console.error('Failed to fetch tables:', err);
            setResourceErrors(prev => new Map(prev).set(`${schemaName}:tables`, err.message));
        } finally {
            updateLoading(schemaName, 'tables', false);
        }
    };

    const fetchProcedures = async (schemaName: string) => {
        updateLoading(schemaName, 'procedures', true);
        try {
            const res = await fetch(`/api/procedures?connectionId=${connectionId}&schema=${schemaName}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch procedures');
            setSchemaProcedures(prev => new Map(prev).set(schemaName, data.procedures || []));
        } catch (err: any) {
            console.error('Failed to fetch procedures:', err);
            setResourceErrors(prev => new Map(prev).set(`${schemaName}:procedures`, err.message));
        } finally {
            updateLoading(schemaName, 'procedures', false);
        }
    };

    const toggleSchema = async (schemaName: string) => {
        const newExpanded = new Set(expandedSchemas);
        if (newExpanded.has(schemaName)) {
            newExpanded.delete(schemaName);
        } else {
            newExpanded.add(schemaName);
            // Fetch tables and procedures if not already loaded
            if (!schemaTables.has(schemaName)) {
                fetchTables(schemaName);
            }
            if (!schemaProcedures.has(schemaName)) {
                fetchProcedures(schemaName);
            }
        }
        setExpandedSchemas(newExpanded);
    };

    const executeQuery = useCallback(async () => {
        if (!connectionId || !query.trim()) {
            return;
        }

        // Get selected text from editor, or use full query
        let queryToExecute = query.trim();
        if (editorRef) {
            const selection = editorRef.getSelection();
            const selectedText = editorRef.getModel()?.getValueInRange(selection);
            if (selectedText && selectedText.trim()) {
                queryToExecute = selectedText.trim();
            }
        }

        if (!queryToExecute) {
            return;
        }

        setExecuting(true);
        setError('');
        setWarning('');
        setResult(null);

        // Validate query syntax for database type
        if (connectionInfo) {
            const syntaxWarning = validateQuerySyntax(queryToExecute, connectionInfo.type);
            if (syntaxWarning) {
                setWarning(syntaxWarning);
            }
        }

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    query: queryToExecute,
                    timeout: 30000,
                    maxRows: 1000,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Query execution failed');
            }

            setResult(data);

            // Track database changes for version control
            if (connectionId && queryToExecute) {
                const change = parseQueryForChanges(queryToExecute, data.rowCount);
                if (change) {
                    await trackChange(connectionId, change);
                    await loadPendingChanges(); // Refresh pending count
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setExecuting(false);
        }
    }, [connectionId, query]);



    const exportToCSV = () => {
        if (!result || !result.rows.length) return;

        const headers = result.fields.map((f) => f.name).join(',');
        const rows = result.rows.map((row) =>
            result.fields.map((f) => JSON.stringify(row[f.name] || '')).join(',')
        );

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `query-result-${Date.now()}.csv`;
        a.click();

        URL.revokeObjectURL(url);
    };

    if (!connectionId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mb-2">No connection selected</h2>
                    <p className="text-muted-foreground mb-6">
                        Please select a connection from the dashboard
                    </p>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Database className="w-8 h-8 text-primary" />
                            <span className="text-2xl font-bold">BosDB</span>
                        </Link>
                        <div className="text-sm text-muted-foreground">Query Editor</div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Sidebar - Schema Explorer */}
                <aside className="w-64 border-r border-border p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <TableIcon className="w-4 h-4" />
                            Explorer
                        </h3>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleRefresh}
                                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition"
                                title="Refresh Explorer"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setShowTableDesigner(true)}
                                className="p-1 hover:bg-accent rounded text-primary"
                                title="Create New Table"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {schemas.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No schemas found</p>
                        ) : (
                            schemas.map((schema) => (
                                <div key={schema.name} className="text-sm">
                                    <button
                                        onClick={() => toggleSchema(schema.name)}
                                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded transition"
                                    >
                                        {expandedSchemas.has(schema.name) ? (
                                            <ChevronDown className="w-3 h-3" />
                                        ) : (
                                            <ChevronRight className="w-3 h-3" />
                                        )}
                                        <Database className="w-3 h-3" />
                                        <span className="font-medium">{schema.name}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            ({schema.tableCount})
                                        </span>
                                    </button>

                                    {expandedSchemas.has(schema.name) && (
                                        <div className="ml-6 mt-1 space-y-0.5">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Tables</div>

                                            {loadingResources.get(schema.name)?.tables ? (
                                                <div className="px-2 py-1 text-xs text-muted-foreground">Loading tables...</div>
                                            ) : resourceErrors.get(`${schema.name}:tables`) ? (
                                                <div className="px-2 py-1 text-xs text-destructive/80" title={resourceErrors.get(`${schema.name}:tables`)}>Error loading tables</div>
                                            ) : schemaTables.get(schema.name)?.length === 0 ? (
                                                <div className="px-2 py-1 text-xs text-muted-foreground italic">No tables</div>
                                            ) : (
                                                schemaTables.get(schema.name)?.map((table) => (
                                                    <button
                                                        key={table.name}
                                                        onClick={() => setQuery(`SELECT * FROM ${schema.name}.${table.name} LIMIT 100;`)}
                                                        onContextMenu={(e) => handleTableContextMenu(e, table.name, schema.name)}
                                                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded transition text-left"
                                                        title={`Click to query, right-click for options`}
                                                    >
                                                        <TableIcon className="w-3 h-3 text-muted-foreground" />
                                                        <span className="text-xs">{table.name}</span>
                                                        {table.type && (
                                                            <span className="text-xs text-muted-foreground ml-auto">
                                                                {table.type === 'BASE TABLE' ? 'T' : 'V'}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))
                                            )}

                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Procedures</div>

                                            {loadingResources.get(schema.name)?.procedures ? (
                                                <div className="px-2 py-1 text-xs text-muted-foreground">Loading procedures...</div>
                                            ) : resourceErrors.get(`${schema.name}:procedures`) ? (
                                                <div className="px-2 py-1 text-xs text-destructive/80" title={resourceErrors.get(`${schema.name}:procedures`)}>Error loading procedures</div>
                                            ) : schemaProcedures.get(schema.name)?.length === 0 ? (
                                                <div className="px-2 py-1 text-xs text-muted-foreground italic">No procedures</div>
                                            ) : (
                                                schemaProcedures.get(schema.name)?.map((proc) => (
                                                    <button
                                                        key={proc.name}
                                                        onClick={() => setQuery(`CALL ${schema.name}.${proc.name}();`)}
                                                        className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded transition text-left"
                                                        title={`Click to call ${proc.name}`}
                                                    >
                                                        <FileCode className="w-3 h-3 text-blue-400" />
                                                        <span className="text-xs">{proc.name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Top Bar - Database Info */}
                    {connectionInfo && (
                        <div className="bg-accent/30 border-b border-border px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">{connectionInfo.name}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Type: <span className="font-mono bg-background px-2 py-0.5 rounded">{connectionInfo.type.toUpperCase()}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {connectionInfo.host}:{connectionInfo.port}/{connectionInfo.database}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="border-b border-border p-4 flex items-center gap-2 flex-wrap">
                        <button
                            onClick={executeQuery}
                            disabled={executing || !query.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            {executing ? 'Executing...' : 'Run'}
                        </button>

                        <button
                            onClick={handleExplainQuery}
                            disabled={executing || !query.trim()}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            title="Explain Query Plan"
                        >
                            <FileSearch className="w-4 h-4" />
                            Explain
                        </button>

                        <div className="w-px h-6 bg-border" />

                        <button
                            onClick={handleFormatSQL}
                            disabled={!query.trim()}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            title="Format SQL"
                        >
                            <Wand2 className="w-4 h-4" />
                            Format
                        </button>

                        <button
                            onClick={() => setShowTemplates(true)}
                            className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            title="SQL Templates"
                        >
                            <FileStack className="w-4 h-4" />
                            Templates
                        </button>

                        <div className="w-px h-6 bg-border" />

                        <button
                            className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            onClick={() => setShowSaveModal(true)}
                            disabled={!query.trim()}
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>

                        {result && result.rows.length > 0 && (
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="px-3 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        )}

                        <Link
                            href={`/version-control?connection=${connectionId}`}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 relative"
                        >
                            <GitBranch className="w-4 h-4" />
                            VCS
                            {pendingChanges > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {pendingChanges}
                                </span>
                            )}
                        </Link>

                        <div className="flex-1" />

                        {result && (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {result.executionTime}ms
                                </div>
                                <div>{result.rowCount} rows</div>
                            </div>
                        )}
                    </div>

                    {/* Editor */}
                    <div className="h-80 border-b border-border">
                        < Editor
                            height="100%"
                            language="sql"
                            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                            value={query}
                            onChange={(value: string | undefined) => setQuery(value || '')}
                            onMount={(editor: any) => setEditorRef(editor)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: 'on',
                            }}
                        />
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-auto p-4">
                        {error && (
                            <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        {warning && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500 text-amber-600 dark:text-amber-400 rounded-lg mb-4">
                                {warning}
                            </div>
                        )}
                        {result && !error && (
                            <div>
                                <div className="mb-4 text-sm text-muted-foreground">
                                    Query executed in {result.executionTime}ms · {result.rowCount} rows returned
                                    {result.hasMore && ' · More results available'}
                                </div>

                                {result.rows.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Query executed successfully but returned no rows
                                    </div>
                                ) : (
                                    <div className="border border-border rounded-lg overflow-hidden">
                                        <ResultsToolbar
                                            data={result.rows}
                                            columns={columns}
                                            onFilteredDataChange={setFilteredResults}
                                            onExport={() => setShowExportModal(true)}
                                        />
                                        <div className="h-[500px]">
                                            <DataEditor
                                                rows={result.rows}
                                                fields={result.fields}
                                                onSave={async (updates: Array<{ rowIndex: number; field: string; oldValue: any; newValue: any }>) => {
                                                    try {
                                                        const res = await fetch('/api/data/update', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                connectionId,
                                                                schema: 'public', // TODO: Get detailed schema info
                                                                table: extractTableName(query) || 'users',
                                                                updates
                                                            })
                                                        });

                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            // Refresh query
                                                            executeQuery();
                                                            // Add pending VCS change
                                                            await trackChange(connectionId!, {
                                                                type: 'DATA',
                                                                operation: 'UPDATE',
                                                                target: 'table_name', // Needs proper parsing
                                                                description: `Direct edit of ${updates.length} rows`,
                                                                query: 'UPDATE ... (batch direct edit)'
                                                            });
                                                            loadPendingChanges();
                                                        } else {
                                                            alert(`Update failed: ${data.error}`);
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('Save failed');
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!result && !error && (
                            <div className="text-center py-12 text-muted-foreground">
                                Write a query and click "Run" to execute
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Table Designer Modal */}
            {showTableDesigner && connectionId && (
                <TableDesigner
                    connectionId={connectionId}
                    onClose={() => setShowTableDesigner(false)}
                    onSuccess={() => {
                        setShowTableDesigner(false);
                        fetchSchemas(); // Refresh schema list
                    }}
                />
            )}
            {/* Save Query Modal */}
            {showSaveModal && connectionId && (
                <SaveQueryModal
                    query={query}
                    connectionId={connectionId}
                    onClose={() => setShowSaveModal(false)}
                    onSuccess={() => setShowSaveModal(false)}
                />
            )}

            {/* Export Modal */}
            {showExportModal && result && (
                <ExportModal
                    data={filteredResults.length > 0 ? filteredResults : result.rows}
                    columns={columns}
                    tableName={`query-result-${Date.now()}`}
                    onClose={() => setShowExportModal(false)}
                />
            )}

            {/* Import Modal */}
            {showImportModal && importTable && connectionId && (
                <ImportModal
                    tableName={`${importTable.schema}.${importTable.name}`}
                    connectionId={connectionId}
                    onClose={() => {
                        setShowImportModal(false);
                        setImportTable(null);
                    }}
                    onSuccess={() => {
                        setShowImportModal(false);
                        setImportTable(null);
                    }}
                />
            )}

            {/* SQL Templates Modal */}
            {showTemplates && (
                <SQLTemplateModal
                    onSelect={(sql) => setQuery(sql)}
                    onClose={() => setShowTemplates(false)}
                />
            )}

            {/* Query Plan Viewer */}
            {showQueryPlan && queryPlan && connectionInfo && (
                <QueryPlanViewer
                    plan={queryPlan}
                    executionTime={result?.executionTime}
                    dbType={connectionInfo.type}
                    onClose={() => setShowQueryPlan(false)}
                />
            )}

            {/* Table Context Menu */}
            {contextMenu && (
                <TableContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    tableName={contextMenu.tableName}
                    schemaName={contextMenu.schemaName}
                    onClose={() => setContextMenu(null)}
                    onSelectQuery={(sql) => setQuery(sql)}
                    onImport={() => {
                        setImportTable({ name: contextMenu.tableName, schema: contextMenu.schemaName });
                        setShowImportModal(true);
                        setContextMenu(null);
                    }}
                />
            )}

            {/* AI SQL Assistant */}
            {connectionId && connectionInfo && (
                <AIAssistantPanel
                    connectionId={connectionId}
                    connectionInfo={connectionInfo}
                    schemas={schemas.map(s => s.name)}
                    tables={Array.from(schemaTables.entries()).flatMap(([schema, tables]) =>
                        tables.map(t => ({ schema, name: t.name }))
                    )}
                    onInsertQuery={(sql) => setQuery(sql)}
                    onRunQuery={(sql) => {
                        setQuery(sql);
                        setTimeout(() => executeQuery(), 100);
                    }}
                />
            )}
        </div>
    );
}

// Wrapper with Suspense for useSearchParams
export default function QueryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
            <QueryPageContent />
        </Suspense>
    );
}
