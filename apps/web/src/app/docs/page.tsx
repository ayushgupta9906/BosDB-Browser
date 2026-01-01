'use client';

import { Database, Book, Code, GitBranch, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DocumentationPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-6 py-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Database className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">BosDB</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8 max-w-4xl">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Book className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold">Documentation</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Learn how to use BosDB effectively
                    </p>
                </div>

                {/* Quick Start */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Quick Start</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">1. Create a Connection</h3>
                            <p className="text-muted-foreground">
                                Click "New Connection" on the dashboard and enter your database credentials.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Run Queries</h3>
                            <p className="text-muted-foreground">
                                Click "Run Query" or select a connection to open the query editor.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Explore Schema</h3>
                            <p className="text-muted-foreground">
                                Use the left sidebar to browse databases, schemas, and tables.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Supported Databases */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Supported Databases</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">Relational (SQL)</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                PostgreSQL, MySQL, MariaDB, Oracle, SQLite, Firebird, CUBRID, H2, Derby, DB2, Informix, Sybase, HANA, Ingres, Interbase, HSQLDB, Access
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Standard SQL & JDBC support</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">NoSQL & Key-Value</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                MongoDB, Redis, Couchbase, CouchDB, OrientDB, CosmosDB
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">JSON & Multi-model support</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">Search & Analytics</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Elasticsearch, Solr, Meilisearch, DuckDB, Prometheus, InfluxDB, ClickHouse
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Analytics & Time-series</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">Docker Provisioning</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Instant database spin-up using Docker. Supporting Oracle, Postgres, MySQL, and 20+ others.
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">One-click deployment</code>
                        </div>
                    </div>
                </div>

                {/* Pro Tips & Shortcuts */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-6 h-6 text-amber-500" />
                        <h2 className="text-2xl font-semibold">Pro Tips & Shortcuts</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                            <span className="text-sm font-medium">Execute Query</span>
                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">Ctrl + E</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                            <span className="text-sm font-medium">Format SQL</span>
                            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border border-border">Ctrl + Shift + F</kbd>
                        </div>
                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                <strong>Multi-Query Support:</strong> Separate multiple SQL queries with semicolons (;) to execute them sequentially and view all result sets at once.
                            </p>
                        </div>
                        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400">
                                <strong>Provisioning Cancellation:</strong> If a database is taking too long to pull, click the red cross (✕) in the provisioning modal to cancel immediately.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Version Control */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <GitBranch className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Version Control & Comparison</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                        BosDB tracks all schema and data changes made through the editor. Use the <strong>VCS</strong> tab to:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        <li>View pending changes before committing.</li>
                        <li><strong>Compare</strong> current state with previous revisions.</li>
                        <li>Generate "Inverse SQL" to undo accidental changes.</li>
                        <li>Branch and fork database states for experimentation.</li>
                    </ul>
                </div>

                {/* Features Summary */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Universal Database Adapter (30+ DBs)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Git-like Version Control for Data</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Smart SQL Syntax Validation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Visual Table Designer & Importer</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>AI-Powered SQL Assistant</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Direct Data Editing in Results</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Encrypted Connection Persistence</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
