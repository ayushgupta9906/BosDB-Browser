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
                            <h3 className="font-semibold mb-2">PostgreSQL</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Full SQL support with advanced features
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Default Port: 5432</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">MySQL</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Popular relational database
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Default Port: 3306</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">MariaDB</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                MySQL-compatible fork
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Default Port: 3306</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">MongoDB</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Document-oriented NoSQL database
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Default Port: 27017</code>
                        </div>

                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold mb-2">Redis</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                In-memory key-value store
                            </p>
                            <code className="text-xs bg-accent px-2 py-1 rounded">Default Port: 6379</code>
                        </div>
                    </div>
                </div>

                {/* Query Examples */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Code className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Query Examples</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">PostgreSQL / MySQL / MariaDB</h3>
                            <pre className="bg-background p-4 rounded-lg border border-border overflow-x-auto text-sm">
                                {`SELECT * FROM users WHERE active = true LIMIT 10;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">MongoDB (JSON Format)</h3>
                            <pre className="bg-background p-4 rounded-lg border border-border overflow-x-auto text-sm">
                                {`{
  "find": "users",
  "filter": {"age": {"$gt": 18}},
  "limit": 10
}`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Redis (JSON Format)</h3>
                            <pre className="bg-background p-4 rounded-lg border border-border overflow-x-auto text-sm">
                                {`{
  "command": "GET",
  "args": ["mykey"]
}

{
  "command": "KEYS",
  "args": ["*"]
}`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <GitBranch className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-semibold">Features</h2>
                    </div>

                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Multi-database support (PostgreSQL, MySQL, MariaDB, MongoDB, Redis)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Query history with automatic tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Saved queries for quick access</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Schema explorer with table browsing</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Syntax validation and helpful warnings</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>Dark/Light mode support</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>CSV export for query results</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
