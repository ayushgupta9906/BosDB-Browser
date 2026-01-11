
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function SuperAdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'super_admin_login',
                    email: email.trim(),
                    password: password
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Success - backend validated role
                localStorage.setItem('bosdb_current_user', JSON.stringify(data.user));
                router.push('/super-admin');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err: any) {
            setError(err.message || 'Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans text-white">
            <div className="max-w-md w-full">
                {/* Back Link */}
                <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition mb-8 text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Standard Login
                </Link>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col items-center mb-8 relative z-10">
                        <div className="h-12 w-12 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-900/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Super Admin Access</h1>
                        <p className="text-gray-400 text-sm mt-1">Restricted area for system administrators</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Administrator Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@bosdb.com"
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pl-10"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all mt-2 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Authenticate
                                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-gray-600">
                            Secure System • IP Logged • UTC {new Date().toISOString().split('T')[0]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
