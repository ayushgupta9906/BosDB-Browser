'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Database, Moon, Sun, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [connections, setConnections] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections');
            const data = await res.json();
            setConnections(data.connections || []);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        }
    };

    const deleteConnection = async (id: string) => {
        if (!confirm('Delete this connection?')) return;

        try {
            await fetch(`/api/connections?id=${id}`, { method: 'DELETE' });
            setConnections(connections.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete connection:', error);
        }
    };

    const exportSettings = () => {
        const data = {
            connections: connections.map(c => ({
                ...c,
                // Don't export encrypted credentials for security
                password: undefined,
            })),
            theme,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bosdb-settings-${Date.now()}.json`;
        a.click();
    };

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
                        <SettingsIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-bold">Settings</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage your database connections and preferences
                    </p>
                </div>

                {/* Theme Settings */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
                        </div>
                        {mounted && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`p-3 rounded-lg border ${theme === 'light'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border hover:bg-accent'
                                        }`}
                                >
                                    <Sun className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`p-3 rounded-lg border ${theme === 'dark'
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border hover:bg-accent'
                                        }`}
                                >
                                    <Moon className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Connection Management */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Database Connections</h2>
                        <span className="text-sm text-muted-foreground">{connections.length} connections</span>
                    </div>

                    {connections.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No connections configured</p>
                    ) : (
                        <div className="space-y-3">
                            {connections.map((conn) => (
                                <div
                                    key={conn.id}
                                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                                >
                                    <div>
                                        <p className="font-semibold">{conn.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {conn.type.toUpperCase()} - {conn.host}:{conn.port}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteConnection(conn.id)}
                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Data Management */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Data Management</h2>
                    <div className="space-y-3">
                        <button
                            onClick={exportSettings}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg hover:bg-accent transition flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="font-medium">Export Settings</p>
                                    <p className="text-sm text-muted-foreground">Download connections and preferences</p>
                                </div>
                            </div>
                        </button>

                        <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                <strong>Note:</strong> Passwords are not included in exports for security reasons.
                            </p>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>BosDB - Production-Grade Database Management Tool</p>
                    <p className="mt-2">Version 0.1.0</p>
                </div>
            </div>
        </div>
    );
}
