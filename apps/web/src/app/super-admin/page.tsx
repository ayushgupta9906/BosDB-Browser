
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Building2,
    ShieldCheck,
    Activity,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Search,
    Download,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
}

interface Organization {
    id: string;
    name: string;
    domain: string;
    type: string;
    plan: string;
    createdAt: string;
    userCount: number;
    users: User[];
}

interface DashboardStats {
    totalUsers: number;
    totalOrgs: number;
    lastUpdated: string;
}

export default function SuperAdminPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const toast = useToast();

    // Management State
    const [editingOrg, setEditingOrg] = useState<any | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [userCreationModalOpen, setUserCreationModalOpen] = useState(false);
    const [systemSettings, setSystemSettings] = useState({
        maintenanceMode: false,
        allowSignup: false,
        betaFeatures: false,
        broadcastMessage: ''
    });

    useEffect(() => {
        // Initial Auth Check (Client-side fast fail)
        const currentUserStr = localStorage.getItem('bosdb_current_user');
        if (currentUserStr) {
            try {
                const user = JSON.parse(currentUserStr);
                if (!user.email?.endsWith('@bosdb.com')) {
                    router.push('/');
                    return;
                }
            } catch (e) {
                router.push('/');
                return;
            }
        } else {
            // Allow fetch to decide
        }

        fetchDashboardData();
    }, [router]);

    const handleSaveOrg = async () => {
        if (!editingOrg) return;
        try {
            // Mock call or real
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            const res = await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'update_org',
                    id: editingOrg.id,
                    data: { name: editingOrg.name, subscription: { ...editingOrg.subscription, plan: editingOrg.plan } } // Approximate structure match
                })
            });

            if (res.ok) {
                await fetchDashboardData();
                setEditingOrg(null);
            } else {
                toast.error('Failed to update organization');
            }

        } catch (e) {
            toast.error('Error updating organization');
        }
    };

    const handleBlockOrg = async (status: 'active' | 'suspended') => {
        if (!editingOrg) return;
        if (!confirm(`Are you sure you want to ${status === 'suspended' ? 'BLOCK' : 'UNBLOCK'} this organization?`)) return;

        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            const res = await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'block_org',
                    id: editingOrg.id,
                    data: { status }
                })
            });

            if (res.ok) {
                await fetchDashboardData();
                setEditingOrg(null);
            } else {
                toast.error('Failed to update organization status');
            }
        } catch (e) {
            toast.error('Error updating status');
        }
    }

    const handleDeleteOrg = async () => {
        if (!editingOrg) return;
        if (!confirm('ARE YOU SURE? This will PERMANENTLY DELETE the organization and all its data. This action cannot be undone.')) return;

        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            const res = await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'delete_org',
                    id: editingOrg.id,
                    data: {}
                })
            });

            if (res.ok) {
                await fetchDashboardData();
                setEditingOrg(null);
            } else {
                toast.error('Failed to delete organization');
            }
        } catch (e) {
            toast.error('Error deleting organization');
        }
    }

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const role = data.role as string;
        const email = data.email as string;

        if (role === 'super-admin' && !email.endsWith('@bosdb.com')) {
            toast.warning('Security Restriction: Super Admins must have a @bosdb.com email address.');
            return;
        }

        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            const res = await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'create_user',
                    id: 'new',
                    data: data
                })
            });

            if (res.ok) {
                await fetchDashboardData();
                setUserCreationModalOpen(false);
                toast.success('User created successfully');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'Failed to create user');
            }

        } catch (e) {
            toast.error('Error creating user');
        }
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            // Build update data
            const updateData: any = {
                role: editingUser.role,
                status: editingUser.status,
                name: editingUser.name,
                email: editingUser.email
            };

            // Only include password if provided
            if (editingUser.newPassword && editingUser.newPassword.trim()) {
                updateData.password = editingUser.newPassword;
            }

            const res = await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'update_user',
                    id: editingUser.id,
                    data: updateData
                })
            });

            if (res.ok) {
                await fetchDashboardData();
                setEditingUser(null);
            } else {
                toast.error('Failed to update user');
            }

        } catch (e) {
            toast.error('Error updating user');
        }
    };


    const fetchDashboardData = async () => {
        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            const res = await fetch('/api/super-admin/dashboard', {
                headers: {
                    'x-user-email': user?.email || '',
                }
            });

            if (res.status === 403) {
                setError('Unauthorized Access');
                setTimeout(() => router.push('/'), 2000);
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch data');

            const data = await res.json();
            if (data.settings) {
                setSystemSettings(data.settings);
            }
            if (data.organizations) {
                setOrganizations(data.organizations);
            }
            if (data.users) {
                setUsers(data.users);
            }
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = async (key: string) => {
        const newSettings = { ...systemSettings, [key]: !(systemSettings as any)[key] };
        setSystemSettings(newSettings); // Optimistic update

        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'update_system_settings',
                    id: 'global',
                    data: newSettings
                })
            });
        } catch (error) {
            console.error('Failed to save settings', error);
            // Revert on error if needed
        }
    };

    const handleBroadcastChange = async (message: string) => {
        const newSettings = { ...systemSettings, broadcastMessage: message };
        setSystemSettings(newSettings);
        // Debounce actual save in real app, or save on blur/button. For now, simple save.
    };

    const saveBroadcast = async () => {
        try {
            const currentUserStr = localStorage.getItem('bosdb_current_user');
            const user = currentUserStr ? JSON.parse(currentUserStr) : null;

            await fetch('/api/super-admin/mutate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': user?.email || '',
                },
                body: JSON.stringify({
                    action: 'update_system_settings',
                    id: 'global',
                    data: systemSettings // saving current state which has updated message
                })
            });
            toast.success('Broadcast message saved');
        } catch (error) {
            console.error('Failed to save settings', error);
        }
    }

    const toggleOrg = (orgId: string) => {
        setExpandedOrg(expandedOrg === orgId ? null : orgId);
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.id.includes(searchQuery.toLowerCase()) ||
        (org.domain && org.domain.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400">{error}</p>
                <Link href="/" className="mt-6 text-green-500 hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-green-500/30">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <h1 className="font-semibold text-lg tracking-tight">BosDB <span className="text-gray-500">Super Admin</span></h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">
                                SA
                            </div>
                            <span className="text-xs text-gray-300">ayush@bosdb.com</span>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('bosdb_current_user');
                                router.push('/');
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/20 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Overview
                        {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('organizations')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'organizations' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Organizations
                        {activeTab === 'organizations' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'users' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        All Users
                        {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('admins')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'admins' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Super Admins
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        System Settings
                    </button>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-gray-400">Total</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{stats?.totalOrgs || 0}</div>
                                <div className="text-sm text-gray-500">Registered Organizations</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-gray-400">Total</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">{stats?.totalUsers || 0}</div>
                                <div className="text-sm text-gray-500">Active Users</div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-gray-400">System</span>
                                </div>
                                <div className="text-3xl font-bold mb-1">Healthy</div>
                                <div className="text-sm text-gray-500">All services operational</div>
                            </div>
                        </div>

                        {/* Recent Activity Stub */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Recent System Activity</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()} - System Audit</p>
                                        <p className="text-sm text-gray-300">Dashboard accessed by Super Admin</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500"></div>
                                    <div>
                                        <p className="text-xs text-gray-400">{new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString()} - Database Sync</p>
                                        <p className="text-sm text-gray-300">User metrics aggregated successfully</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ORGANIZATIONS TAB */}
                {activeTab === 'organizations' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Organizations Registry</h2>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search organizations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-64 transition-all"
                                    />
                                </div>
                                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400 bg-black/20">
                                <div className="col-span-4">Organization</div>
                                <div className="col-span-2">Domain</div>
                                <div className="col-span-2">Plan</div>
                                <div className="col-span-2">Users</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {filteredOrgs.map(org => (
                                    <React.Fragment key={org.id}>
                                        <div
                                            className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedOrg === org.id ? 'bg-white/[0.02]' : ''}`}
                                            onClick={() => toggleOrg(org.id)}
                                        >
                                            <div className="col-span-4 flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-gradient-to-tr from-gray-800 to-gray-900 flex items-center justify-center border border-white/10 relative">
                                                    <span className="text-xs font-bold text-gray-400">{org.name.substring(0, 2).toUpperCase()}</span>
                                                    {(org as any).status === 'suspended' && (
                                                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-black" title="Suspended"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white flex items-center gap-2">
                                                        {org.name}
                                                        {(org as any).status === 'suspended' && <span className="text-[10px] bg-red-500/20 text-red-500 px-1 rounded border border-red-500/20">BLOCKED</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">ID: {org.id}</div>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-sm text-gray-400">{org.domain || '-'}</div>
                                            <div className="col-span-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${org.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                    org.plan === 'pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                    }`}>
                                                    {org.plan.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2 text-sm text-gray-400">
                                                <Users className="h-4 w-4" />
                                                {org.userCount}
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                {/* Visual indicator of collapsed/expanded state */}
                                                {/* Actions are inside expanded view */}
                                                {expandedOrg === org.id ? (
                                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                )}
                                            </div>
                                        </div>

                                        {expandedOrg === org.id && (
                                            <div className="bg-black/20 p-4 pl-16 border-b border-white/5 animate-in slide-in-from-top-2 duration-200">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Users in {org.name} ({org.users.length})</h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingOrg(org);
                                                        }}
                                                        className="text-xs text-blue-400 hover:text-blue-300"
                                                    >
                                                        Manage Organization
                                                    </button>
                                                </div>
                                                {org.users.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {org.users.map(user => (
                                                            <div key={user.id} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs text-green-500 font-medium">
                                                                        {user.name.substring(0, 1)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-300">{user.name}</div>
                                                                        <div className="text-xs text-gray-600">{user.email}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-600 italic">No users found in this organization.</div>
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS TAB (GLOBAL) */}
                {activeTab === 'users' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Global User Registry</h2>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search specific user..."
                                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-64 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setUserCreationModalOpen(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    Create User
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400 bg-black/20">
                                <div className="col-span-4">User Details</div>
                                <div className="col-span-3">Role</div>
                                <div className="col-span-3">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {/* Flatten list of all users from all orgs */}
                                {organizations.flatMap(o => o.users).map((user, idx) => (
                                    <div key={user.id + idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-500">
                                                {user.name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-gray-300 border border-white/10 capitalize">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${user.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            <span className="text-sm text-gray-400 capitalize">{user.status}</span>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="text-xs text-gray-500 hover:text-white transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {/* ADMINS TAB - DEDICATED SUPER ADMIN MANAGEMENT */}
                {activeTab === 'admins' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Super Admin Access Control</h2>
                                <p className="text-sm text-gray-500">Manage privileged users with full access to this dashboard.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingUser({ role: 'super-admin' }); // Hack to preset role for creation
                                    setUserCreationModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Users className="h-4 w-4" />
                                Add Super Admin
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.filter(u => u.role === 'super-admin' || u.email === 'ayush@bosdb.com').map((user: any) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                                            <td className="px-6 py-4 text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                                                    Super Admin
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.filter(u => u.role === 'super-admin' || u.email === 'ayush@bosdb.com').length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No other Super Admins found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-green-500" />
                                System Controls
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <div className="font-medium text-white">Maintenance Mode</div>
                                        <div className="text-xs text-gray-500">Disable access for all non-admin users</div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting('maintenanceMode')}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings.maintenanceMode ? 'bg-green-600' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <div className="font-medium text-white">Public Signup</div>
                                        <div className="text-xs text-gray-500">Allow new users to register freely</div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting('allowSignup')}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings.allowSignup ? 'bg-green-600' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${systemSettings.allowSignup ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div>
                                        <div className="font-medium text-white">Beta Features</div>
                                        <div className="text-xs text-gray-500">Enable experimental features globally</div>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting('betaFeatures')}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings.betaFeatures ? 'bg-green-600' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-transform ${systemSettings.betaFeatures ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Communication</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Global Broadcast Message</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g. System maintenance at 22:00 UTC"
                                            value={systemSettings.broadcastMessage}
                                            onChange={(e) => handleBroadcastChange(e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                        />
                                        <button
                                            onClick={saveBroadcast}
                                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">This message will appear on the top of user dashboards.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* EDIT ORGANIZATION MODAL */}
            {editingOrg && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Edit Organization</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    value={editingOrg.name}
                                    onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Subscription Plan</label>
                                <select
                                    value={editingOrg.plan}
                                    onChange={(e) => setEditingOrg({ ...editingOrg, plan: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            {/* Status Actions */}
                            <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                                <label className="block text-xs text-gray-400 mb-1">Danger Zone</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleBlockOrg(editingOrg.status === 'suspended' ? 'active' : 'suspended')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${editingOrg.status === 'suspended' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                                    >
                                        {editingOrg.status === 'suspended' ? 'Unblock Organization' : 'Block Organization'}
                                    </button>
                                    <button
                                        onClick={handleDeleteOrg}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white border border-red-600 transition-colors"
                                    >
                                        Delete Organization
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingOrg(null)}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveOrg}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">New Password (Optional)</label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to keep current password"
                                    value={editingUser.newPassword || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="super-admin">Super Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE USER MODAL */}
            {userCreationModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Create New User</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    name="name"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    name="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    name="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Role</label>
                                <select
                                    name="role"
                                    defaultValue={activeTab === 'admins' ? 'super-admin' : 'user'}
                                    disabled={activeTab === 'admins'}
                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 ${activeTab === 'admins' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {activeTab === 'admins' ? (
                                        <option value="super-admin">Super Admin (Privileged)</option>
                                    ) : (
                                        <>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="super-admin">Super Admin (Privileged)</option>
                                        </>
                                    )}
                                </select>
                                {activeTab === 'admins' && <input type="hidden" name="role" value="super-admin" />}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setUserCreationModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                                >
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
