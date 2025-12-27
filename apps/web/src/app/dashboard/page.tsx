'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, Play, History, Save, LogOut, User, Shield, Zap, Star, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout } from '@/lib/auth';
import { fetchOrgSubscription, getOrgSubscriptionStatus } from '@/lib/subscription';

interface Connection {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    database: string;
    status: string;
    readOnly: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewConnection, setShowNewConnection] = useState(false);
    const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
    const [subscriptionStatus, setSubscriptionStatus] = useState({ isPro: false, isTrial: false });
    const [orgName, setOrgName] = useState<string | null>(null);

    useEffect(() => {
        // Check if user is logged in
        const user = getCurrentUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setCurrentUser(user);

        // Fetch organization subscription status
        if (user.organizationId) {
            fetchOrgSubscription(user.organizationId).then(status => {
                setSubscriptionStatus(status);
                const cached = getOrgSubscriptionStatus();
                setOrgName(cached.orgName);
            });
        }
    }, [router]);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/connections');
            const data = await res.json();
            setConnections(data.connections || []);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <Database className="w-8 h-8 text-primary" />
                            <span className="text-2xl font-bold">BosDB</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            {orgName && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <Building className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-medium text-blue-400">{orgName}</span>
                                </div>
                            )}
                            {currentUser && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                                    <User className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium">{currentUser.name}</span>
                                    <span className="text-xs text-muted-foreground">({currentUser.id})</span>
                                </div>
                            )}
                            <Link href="/docs">
                                <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
                                    Documentation
                                </button>
                            </Link>
                            <Link href="/settings">
                                <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition">
                                    Settings
                                </button>
                            </Link>
                            {currentUser?.role === 'admin' && (
                                <Link href="/admin">
                                    <button className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition flex items-center gap-1">
                                        <Shield className="w-4 h-4" />
                                        Admin Panel
                                    </button>
                                </Link>
                            )}                     {!subscriptionStatus.isPro && (
                                <Link href="/pricing">
                                    <button className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition flex items-center gap-1">
                                        <Zap className="w-4 h-4" />
                                        Upgrade to Pro
                                    </button>
                                </Link>
                            )}
                            {subscriptionStatus.isPro && (
                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${subscriptionStatus.isTrial
                                    ? 'bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-400'
                                    : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400'
                                    }`}>
                                    <Star className="w-3 h-3" />
                                    {subscriptionStatus.isTrial ? 'Trial' : 'Pro'}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    logout();
                                    router.push('/login');
                                }}
                                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Database Connections</h1>
                    <p className="text-muted-foreground">
                        Manage your database connections and execute queries
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <QuickActionCard
                        icon={<Plus className="w-6 h-6" />}
                        title="New Connection"
                        description="Connect to a database"
                        onClick={() => setShowNewConnection(true)}
                    />
                    <QuickActionCard
                        icon={<Play className="w-6 h-6" />}
                        title="Run Query"
                        description="Execute SQL queries"
                        disabled={connections.length === 0}
                        href={connections.length > 0 ? `/query?connection=${connections[0].id}` : undefined}
                    />
                    <QuickActionCard
                        icon={<History className="w-6 h-6" />}
                        title="Query History"
                        description="View past queries"
                        href="/history"
                    />
                    <QuickActionCard
                        icon={<Save className="w-6 h-6" />}
                        title="Saved Queries"
                        description="Access saved queries"
                        href="/saved-queries"
                    />
                </div>

                {/* Connections List */}
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Your Connections</h2>

                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading...</div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by creating your first database connection
                            </p>
                            <button
                                onClick={() => setShowNewConnection(true)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />
                                New Connection
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {connections.map((conn) => (
                                <ConnectionCard key={conn.id} connection={conn} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New Connection Modal */}
            {showNewConnection && (
                <NewConnectionModal
                    onClose={() => setShowNewConnection(false)}
                    onSuccess={() => {
                        setShowNewConnection(false);
                        fetchConnections();
                    }}
                />
            )}
        </div>
    );
}

function QuickActionCard({
    icon,
    title,
    description,
    onClick,
    disabled,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick?: () => void;
    disabled?: boolean;
    href?: string;
}) {
    const content = (
        <>
            <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </>
    );

    const className = `p-6 bg-card border border-border rounded-lg text-left transition-all hover:border-primary hover:shadow-lg group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    if (href && !disabled) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {content}
        </button>
    );
}

function ConnectionCard({ connection }: { connection: Connection }) {
    return (
        <div className="p-6 bg-card border border-border rounded-lg hover:border-primary transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{connection.type}</p>
                    </div>
                </div>
                <span
                    className={`px-2 py-1 text-xs rounded-full ${connection.status === 'connected'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-gray-500/10 text-gray-500'
                        }`}
                >
                    {connection.status}
                </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Host:</span>
                    <span className="font-mono">{connection.host}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span className="font-mono">{connection.database}</span>
                </div>
                {connection.readOnly && (
                    <div className="text-xs text-amber-500">Read-only mode</div>
                )}
            </div>

            <Link
                href={`/query?connection=${connection.id}`}
                className="block w-full px-4 py-2 bg-primary text-primary-foreground text-center rounded-lg hover:bg-primary/90 transition"
            >
                Open Query Editor
            </Link>
        </div>
    );
}

function NewConnectionModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const router = useRouter();
    const [provisioning, setProvisioning] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');

    const provisionDatabase = async (type: string) => {
        setProvisioning(true);
        setProgress(`Creating ${type} database...`);
        setError('');

        try {
            const user = getCurrentUser();
            if (!user) {
                throw new Error('Not logged in');
            }

            // Call Docker provision API
            const res = await fetch('/api/docker/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user.email || '',
                },
                body: JSON.stringify({
                    type,
                    name: `My ${type.charAt(0).toUpperCase() + type.slice(1)} Database`,
                    autoStart: true
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create database');
            }

            setProgress('Database created! Setting up connection...');

            // Auto-save connection
            const connRes = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.database.name,
                    type: data.database.type,
                    host: 'localhost',
                    port: data.database.port,
                    database: data.database.database,
                    username: data.database.username,
                    password: data.database.password,
                    ssl: false,
                    readOnly: false,
                }),
            });

            const connData = await connRes.json();

            if (!connRes.ok) {
                throw new Error(connData.error || 'Failed to save connection');
            }

            setProgress('✅ Ready! Redirecting to query editor...');

            // Redirect to query page
            setTimeout(() => {
                router.push(`/query?connection=${connData.id}`);
            }, 1000);

        } catch (err: any) {
            setError(err.message || 'Failed to create database');
            setProvisioning(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Create Database</h2>
                        <p className="text-muted-foreground">
                            Select a database type to get started instantly
                        </p>
                    </div>
                    {!provisioning && (
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {provisioning ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-lg font-medium mb-2">{progress}</p>
                        <p className="text-sm text-muted-foreground">
                            This may take up to 30 seconds...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {/* PostgreSQL */}
                        <button
                            onClick={() => provisionDatabase('postgres')}
                            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                        >
                            <div className="text-4xl mb-3">🐘</div>
                            <h3 className="text-lg font-semibold mb-1">PostgreSQL</h3>
                            <p className="text-sm text-muted-foreground">
                                Advanced open-source database
                            </p>
                            <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                                Click to create →
                            </div>
                        </button>

                        {/* MySQL */}
                        <button
                            onClick={() => provisionDatabase('mysql')}
                            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                        >
                            <div className="text-4xl mb-3">🐬</div>
                            <h3 className="text-lg font-semibold mb-1">MySQL</h3>
                            <p className="text-sm text-muted-foreground">
                                Popular relational database
                            </p>
                            <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                                Click to create →
                            </div>
                        </button>

                        {/* MongoDB */}
                        <button
                            onClick={() => provisionDatabase('mongodb')}
                            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                        >
                            <div className="text-4xl mb-3">🍃</div>
                            <h3 className="text-lg font-semibold mb-1">MongoDB</h3>
                            <p className="text-sm text-muted-foreground">
                                NoSQL document database
                            </p>
                            <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                                Click to create →
                            </div>
                        </button>

                        {/* Redis */}
                        <button
                            onClick={() => provisionDatabase('redis')}
                            className="p-6 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                        >
                            <div className="text-4xl mb-3">⚡</div>
                            <h3 className="text-lg font-semibold mb-1">Redis</h3>
                            <p className="text-sm text-muted-foreground">
                                In-memory data store
                            </p>
                            <div className="mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                                Click to create →
                            </div>
                        </button>
                    </div>
                )}

                {!provisioning && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground text-center mb-3">
                            Need to connect to an external database?
                        </p>
                        <button
                            onClick={() => {/* TODO: Show external connection form */ }}
                            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm"
                        >
                            Use External Database Instead
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

