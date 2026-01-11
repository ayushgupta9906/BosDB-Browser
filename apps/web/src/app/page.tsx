import Link from 'next/link';
import { Database, Zap, Shield, Users, GitBranch, Table, Edit3, Lock, CreditCard, Star, Check } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-8 h-8 text-purple-400" />
                        <span className="text-xl font-bold text-white">BosDB</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/pricing" className="text-gray-300 hover:text-white transition">
                            Pricing
                        </Link>
                        <Link href="/docs" className="text-gray-300 hover:text-white transition">
                            Docs
                        </Link>
                        <Link href="/login" className="text-gray-300 hover:text-white transition">
                            Login
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-16">
                {/* Hero */}
                <header className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-6">
                        <Star className="w-4 h-4" />
                        Now with Pro subscription!
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                        BosDB
                    </h1>
                    <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
                        Browser-based Database Management with Git-like Version Control
                    </p>
                    <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
                        Connect to <strong>100+ databases</strong> including PostgreSQL, MySQL, MongoDB, Redis, and more.
                        Start for free or try Pro features!
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
                        >
                            🚀 Launch Dashboard
                        </Link>
                        <Link
                            href="/pricing"
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all transform hover:scale-105 border border-white/20"
                        >
                            View Pricing
                        </Link>
                    </div>
                </header>

                {/* Core Features */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Core Features</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<Database className="w-8 h-8" />}
                            title="100+ Database Types"
                            description="PostgreSQL, MySQL, MongoDB, Redis, CockroachDB, and 95+ more supported"
                        />
                        <FeatureCard
                            icon={<GitBranch className="w-8 h-8" />}
                            title="Git-like Version Control"
                            description="Commits, branches, rollback for your data with 3x faster loading"
                            highlight={true}
                        />
                        <FeatureCard
                            icon={<Edit3 className="w-8 h-8" />}
                            title="AI SQL Assistant"
                            description="Get AI-powered help writing queries & debugging"
                            highlight={true}
                        />
                        <FeatureCard
                            icon={<Table className="w-8 h-8" />}
                            title="SQL Debugger"
                            description="Set breakpoints and debug stored procedures"
                            highlight={true}
                        />
                    </div>
                </section>

                {/* All Features Grid */}
                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">Everything You Need</h2>
                    <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
                        BosDB comes packed with features to streamline your database workflow
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureItem icon={<Database />} title="Multi-Database Support" description="PostgreSQL, MySQL, MongoDB, Redis, CockroachDB" />
                        <FeatureItem icon={<GitBranch />} title="Version Control" description="Commits, branches, rollback - 3x faster" />
                        <FeatureItem icon={<Zap />} title="AI SQL Assistant" description="AI-powered query help & suggestions" />
                        <FeatureItem icon={<Shield />} title="SQL Debugger" description="Set breakpoints, debug procedures" />
                        <FeatureItem icon={<Edit3 />} title="Multi-Tab Editor" description="Work on multiple queries simultaneously" />
                        <FeatureItem icon={<Table />} title="Data Grid Editing" description="Spreadsheet-like inline editing" />
                        <FeatureItem icon={<Database />} title="Table Designer" description="Visual schema creation" />
                        <FeatureItem icon={<Users />} title="Multi-User System" description="Login, roles, permissions" />
                        <FeatureItem icon={<Shield />} title="Super Admin Panel" description="Platform owner control panel" />
                        <FeatureItem icon={<Users />} title="Organization Scoping" description="Admins manage only their org" />
                        <FeatureItem icon={<Lock />} title="Granular Permissions" description="Read, Edit, Commit, Schema control" />
                        <FeatureItem icon={<Lock />} title="Password Security" description="bcrypt hashing, separated super admin DB" />
                        <FeatureItem icon={<Zap />} title="Query Editor" description="Monaco editor with syntax highlighting" />
                        <FeatureItem icon={<Star />} title="Demo Accounts" description="Test instantly - no registration needed" />
                        <FeatureItem icon={<CreditCard />} title="Pro Subscription" description="Flexible pricing for teams" />
                    </div>
                </section>

                {/* Pro Section */}
                <section className="mb-20">
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-12 border border-purple-500/30">
                        <div className="flex flex-col lg:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm mb-4">
                                    <Star className="w-4 h-4" />
                                    BosDB Pro
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-4">
                                    Unlock Premium Features
                                </h2>
                                <p className="text-gray-300 mb-6">
                                    Get unlimited connections, version control, table designer, and more with BosDB Pro.
                                </p>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" /> Unlimited Connections
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" /> Git-like Version Control
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" /> AI SQL Assistant & Debugger
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" /> Table Designer & Multi-tabs
                                    </li>
                                    <li className="flex items-center gap-2 text-gray-300">
                                        <Check className="w-4 h-4 text-green-400" /> Granular Permissions & Team Management
                                    </li>
                                </ul>
                                <Link
                                    href="/pricing"
                                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition"
                                >
                                    View Pricing →
                                </Link>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="inline-block bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                                    <p className="text-gray-400 mb-2">Starting at</p>
                                    <p className="text-5xl font-bold text-white mb-2">$29<span className="text-xl text-gray-400">/mo</span></p>
                                    <p className="text-green-400 text-sm">or $249/year (save 29%)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center">
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to manage your databases?
                        </h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                            Join developers who trust BosDB for database management with version control.
                        </p>
                        <div className="mb-8 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/50 inline-block">
                            <p className="text-yellow-300 font-bold mb-2 text-lg animate-pulse">🔥 CRAZY FREE LIMITED TIME OFFER! 🔥</p>
                            <div className="flex flex-col md:flex-row gap-6 text-sm text-gray-200">
                                <div className="text-left">
                                    <span className="block text-purple-300 text-xs font-bold uppercase">Monthly Plan</span>
                                    Code: <strong className="text-white text-lg">bosdb100</strong> (100% OFF)
                                </div>
                                <div className="hidden md:block w-px bg-white/20"></div>
                                <div className="text-left">
                                    <span className="block text-pink-300 text-xs font-bold uppercase">Yearly Plan</span>
                                    Code: <strong className="text-white text-lg">omnigang100</strong> (100% OFF)
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link
                                href="/dashboard"
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all border border-white/20"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-20 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                    <p>© 2025 BosDb Built with ❤️</p>
                </footer>
            </div>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
    highlight = false,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    highlight?: boolean;
}) {
    return (
        <div className={`backdrop-blur-lg rounded-xl p-6 border transition-all group hover:scale-105 ${highlight
            ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
            <div className={`mb-4 group-hover:scale-110 transition-transform ${highlight ? 'text-purple-400' : 'text-purple-400'
                }`}>
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
            {highlight && (
                <div className="mt-3">
                    <span className="inline-block px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">
                        ⭐ PRO
                    </span>
                </div>
            )}
        </div>
    );
}

function FeatureItem({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-purple-400 mt-1">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-white">{title}</h4>
                <p className="text-gray-400 text-sm">{description}</p>
            </div>
        </div>
    );
}
