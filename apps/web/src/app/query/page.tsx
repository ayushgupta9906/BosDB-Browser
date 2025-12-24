'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Play, Save, Download, Clock, Table as TableIcon, Database, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

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

export default function QueryPage() {
    const searchParams = useSearchParams();
    const connectionId = searchParams?.get('connection');
    const { theme } = useTheme();

    const [query, setQuery] = useState('SELECT * FROM information_schema.tables LIMIT 10;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState('');
    const [schemas, setSchemas] = useState<any[]>([]);
    const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set(['public']));
    const [schemaTables, setSchemaTables] = useState<Map<string, TableInfo[]>>(new Map());

    useEffect(() => {
        if (connectionId) {
            fetchSchemas();
        }
    }, [connectionId]);

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
        try {
            const res = await fetch(`/api/tables?connectionId=${connectionId}&schema=${schemaName}`);
            const data = await res.json();
            setSchemaTables(prev => new Map(prev).set(schemaName, data.tables || []));
        } catch (err) {
            console.error('Failed to fetch tables:', err);
        }
    };

    const toggleSchema = async (schemaName: string) => {
        const newExpanded = new Set(expandedSchemas);
        if (newExpanded.has(schemaName)) {
            newExpanded.delete(schemaName);
        } else {
            newExpanded.add(schemaName);
            // Fetch tables if not already loaded
            if (!schemaTables.has(schemaName)) {
                await fetchTables(schemaName);
            }
        }
        setExpandedSchemas(newExpanded);
    };

    const executeQuery = useCallback(async () => {
        if (!connectionId || !query.trim()) {
            return;
        }

        setExecuting(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    query: query.trim(),
                    timeout: 30000,
                    maxRows: 1000,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Query execution failed');
            }

            setResult(data);
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
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TableIcon className="w-4 h-4" />
                        Database Explorer
                    </h3>
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
                                            {schemaTables.get(schema.name)?.map((table) => (
                                                <button
                                                    key={table.name}
                                                    onClick={() => setQuery(`SELECT * FROM ${schema.name}.${table.name} LIMIT 100;`)}
                                                    className="w-full flex items-center gap-1 px-2 py-1 hover:bg-accent rounded transition text-left"
                                                    title={`Click to query ${table.name}`}
                                                >
                                                    <TableIcon className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs">{table.name}</span>
                                                    {table.type && (
                                                        <span className="text-xs text-muted-foreground ml-auto">
                                                            {table.type === 'BASE TABLE' ? 'T' : 'V'}
                                                        </span>
                                                    )}
                                                </button>
                                            )) || (
                                                    <div className="px-2 py-1 text-xs text-muted-foreground">
                                                        Loading tables...
                                                    </div>
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
                    {/* Toolbar */}
                    <div className="border-b border-border p-4 flex items-center gap-4">
                        <button
                            onClick={executeQuery}
                            disabled={executing || !query.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            {executing ? 'Executing...' : 'Run Query'}
                        </button>

                        <button
                            className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            disabled
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>

                        {result && result.rows.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        )}

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
                        <Editor
                            height="100%"
                            language="sql"
                            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                            value={query}
                            onChange={(value) => setQuery(value || '')}
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
                                <div className="font-semibold mb-1">Error</div>
                                <div className="text-sm">{error}</div>
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
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-muted">
                                                    <tr>
                                                        {result.fields.map((field) => (
                                                            <th
                                                                key={field.name}
                                                                className="px-4 py-3 text-left text-sm font-semibold"
                                                            >
                                                                {field.name}
                                                                <div className="text-xs font-normal text-muted-foreground mt-1">
                                                                    {field.dataType}
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.rows.map((row, index) => (
                                                        <tr key={index} className="border-t border-border hover:bg-accent/50">
                                                            {result.fields.map((field) => (
                                                                <td key={field.name} className="px-4 py-3 text-sm font-mono">
                                                                    {row[field.name] === null ? (
                                                                        <span className="text-muted-foreground italic">NULL</span>
                                                                    ) : field.dataType === 'json' || field.dataType === 'jsonb' ? (
                                                                        <pre className="text-xs">
                                                                            {JSON.stringify(row[field.name], null, 2)}
                                                                        </pre>
                                                                    ) : (
                                                                        String(row[field.name])
                                                                    )}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!result && !error && (
                            <div className="text-center py-12 text-muted-foreground">
                                Write a query and click "Run Query" to execute
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
