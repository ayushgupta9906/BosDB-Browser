'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Zap, ArrowLeft, CreditCard, Shield, Star } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { fetchOrgSubscription, PRICING } from '@/lib/subscription';

export default function PricingPage() {
    const router = useRouter();
    const [showPayment, setShowPayment] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_yearly' | 'pro_trial'>('pro_monthly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [subscriptionStatus, setSubscriptionStatus] = useState({ isPro: false, isTrial: false });

    const user = typeof window !== 'undefined' ? getCurrentUser() : null;
    const systemIsPro = subscriptionStatus.isPro;

    useEffect(() => {
        // Fetch organization subscription
        if (user?.organizationId) {
            fetchOrgSubscription(user.organizationId).then(status => {
                setSubscriptionStatus(status);
            });
        }
    }, [user?.organizationId]);

    const handleUpgrade = (plan: 'pro_monthly' | 'pro_yearly' | 'pro_trial') => {
        if (!user) {
            router.push('/login');
            return;
        }
        setSelectedPlan(plan);
        if (plan === 'pro_trial') {
            // Free trial - no payment needed
            handleFreeTrial();
        } else {
            setShowPayment(true);
        }
    };

    const handleFreeTrial = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: 'pro_trial',
                    orgId: user?.organizationId, // Organization subscription
                    userId: user?.id
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert('🎉 Free trial activated! All users now have Pro features for 1 month!');
                router.push('/dashboard');
            } else {
                alert(data.error || 'Failed to activate trial');
            }
        } catch (err: any) {
            alert(err.message || 'Error activating trial');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setError('');

        // Basic validation
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            setError('Card number must be 16 digits');
            return;
        }
        if (!expiry.match(/^\d{2}\/\d{2}$/)) {
            setError('Expiry must be MM/YY format');
            return;
        }
        if (cvv.length !== 3) {
            setError('CVV must be 3 digits');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: selectedPlan,
                    orgId: user?.organizationId, // Organization subscription
                    userId: user?.id,
                    cardNumber: cardNumber.replace(/\s/g, ''),
                    expiryDate: expiry,
                    cvv
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert('🎉 System upgraded to Pro! All users now have Pro features!');
                router.push('/dashboard');
            } else {
                setError(data.error || 'Payment failed');
            }
        } catch (err: any) {
            setError(err.message || 'Payment error');
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        return parts.length ? parts.join(' ') : value;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">Pricing</h1>
                </div>
            </header>

            <div className="container mx-auto px-6 py-16">
                {/* Hero */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">BosDB Pro</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Unlock powerful features for your database management workflow
                    </p>
                    {systemIsPro && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
                            <Star className="w-4 h-4" />
                            You have Pro access!
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
                    {/* Free Plan */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                        <div className="text-4xl font-bold text-white mb-1">$0</div>
                        <p className="text-gray-400 mb-6">Forever free</p>

                        <ul className="space-y-3 mb-8">
                            {PRICING.free.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    {f}
                                </li>
                            ))}
                            <li className="flex items-center gap-2 text-gray-500">
                                <X className="w-4 h-4 text-red-400" />
                                Version Control
                            </li>
                            <li className="flex items-center gap-2 text-gray-500">
                                <X className="w-4 h-4 text-red-400" />
                                Table Designer
                            </li>
                        </ul>

                        <button
                            disabled
                            className="w-full py-3 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                            Current Plan
                        </button>
                        <button
                            onClick={() => handleUpgrade('pro_trial')}
                            disabled={systemIsPro || loading}
                            className="w-full py-2 mt-2 text-sm text-purple-400 hover:text-purple-300 transition disabled:opacity-50"
                        >
                            {loading ? 'Activating...' : '🎁 Start 1 Month Free Trial'}
                        </button>
                    </div>

                    {/* Pro Monthly */}
                    <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500/50 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                            POPULAR
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Pro Monthly</h3>
                        <div className="text-4xl font-bold text-white mb-1">$29</div>
                        <p className="text-gray-400 mb-6">per month</p>

                        <ul className="space-y-3 mb-8">
                            {PRICING.pro_monthly.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-200">
                                    <Check className="w-4 h-4 text-purple-400" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade('pro_monthly')}
                            disabled={systemIsPro}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            {systemIsPro ? 'Already Pro' : 'Upgrade Now'}
                        </button>
                    </div>

                    {/* Pro Yearly */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-2">Pro Yearly</h3>
                        <div className="text-4xl font-bold text-white mb-1">$249</div>
                        <p className="text-gray-400 mb-1">per year</p>
                        <p className="text-green-400 text-sm mb-6">Save 29% (2 months free!)</p>

                        <ul className="space-y-3 mb-8">
                            {PRICING.pro_yearly.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-300">
                                    <Check className="w-4 h-4 text-green-400" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade('pro_yearly')}
                            disabled={systemIsPro}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            {systemIsPro ? 'Already Pro' : 'Upgrade Now'}
                        </button>
                    </div>
                </div>

                {/* Feature Comparison */}
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-white text-center mb-8">Feature Comparison</h3>
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-4 text-left text-gray-400">Feature</th>
                                    <th className="px-6 py-4 text-center text-gray-400">Free</th>
                                    <th className="px-6 py-4 text-center text-purple-400">Pro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr><td className="px-6 py-3 text-gray-300">Database Connections</td><td className="px-6 py-3 text-center text-gray-400">2</td><td className="px-6 py-3 text-center text-white">Unlimited</td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Query History</td><td className="px-6 py-3 text-center text-gray-400">50</td><td className="px-6 py-3 text-center text-white">Unlimited</td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Version Control</td><td className="px-6 py-3 text-center"><X className="w-4 h-4 text-red-400 mx-auto" /></td><td className="px-6 py-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Commit History</td><td className="px-6 py-3 text-center"><X className="w-4 h-4 text-red-400 mx-auto" /></td><td className="px-6 py-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Table Designer</td><td className="px-6 py-3 text-center"><X className="w-4 h-4 text-red-400 mx-auto" /></td><td className="px-6 py-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Data Grid Editing</td><td className="px-6 py-3 text-center text-gray-400">Read-only</td><td className="px-6 py-3 text-center text-white">Full Edit</td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Export Formats</td><td className="px-6 py-3 text-center text-gray-400">CSV</td><td className="px-6 py-3 text-center text-white">CSV, JSON, SQL</td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Granular Permissions</td><td className="px-6 py-3 text-center"><X className="w-4 h-4 text-red-400 mx-auto" /></td><td className="px-6 py-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-3 text-gray-300">Priority Support</td><td className="px-6 py-3 text-center"><X className="w-4 h-4 text-red-400 mx-auto" /></td><td className="px-6 py-3 text-center"><Check className="w-4 h-4 text-green-400 mx-auto" /></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-purple-400" />
                                Demo Payment
                            </h3>
                            <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
                                <Shield className="w-4 h-4" />
                                Demo Mode - No real payment
                            </div>
                            <p className="text-gray-400 text-xs">
                                Use test card: <span className="text-white font-mono">4242 4242 4242 4242</span>
                            </p>
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-gray-400">{selectedPlan === 'pro_monthly' ? 'Pro Monthly' : 'Pro Yearly'}</p>
                            <p className="text-3xl font-bold text-white">
                                ${selectedPlan === 'pro_monthly' ? '29' : '249'}
                                <span className="text-lg text-gray-400">/{selectedPlan === 'pro_monthly' ? 'mo' : 'yr'}</span>
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Card Number</label>
                                <input
                                    type="text"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    maxLength={19}
                                    placeholder="4242 4242 4242 4242"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiry</label>
                                    <input
                                        type="text"
                                        value={expiry}
                                        onChange={(e) => setExpiry(e.target.value)}
                                        maxLength={5}
                                        placeholder="MM/YY"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">CVV</label>
                                    <input
                                        type="text"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                        maxLength={3}
                                        placeholder="123"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : `Pay $${selectedPlan === 'pro_monthly' ? '29' : '249'}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
