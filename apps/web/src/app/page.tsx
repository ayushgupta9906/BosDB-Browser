import Link from 'next/link';
import { Database, Zap, Shield, Users } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <header className="text-center mb-20">
                    <div className="flex items-center justify-center mb-6">
                        <Database className="w-16 h-16 text-purple-400" />
                    </div>
                    <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        BosDB
                    </h1>
                    <p className="text-2xl text-gray-300 mb-8">
                        Browser-based Database Management, Simplified
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                            Get Started
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all backdrop-blur-sm"
                        >
                            Learn More
                        </a>
                    </div>
                </header>

                {/* Features */}
                <section id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    <FeatureCard
                        icon={<Database className="w-10 h-10" />}
                        title="Multi-Database Support"
                        description="Connect to PostgreSQL, MySQL, and MongoDB from a single interface"
                    />
                    <FeatureCard
                        icon={<Zap className="w-10 h-10" />}
                        title="Lightning Fast"
                        description="Optimized connection pooling and query execution for maximum performance"
                    />
                    <FeatureCard
                        icon={<Shield className="w-10 h-10" />}
                        title="Enterprise Security"
                        description="AES-256 encryption, SQL injection protection, and audit logs"
                    />
                    <FeatureCard
                        icon={<Users className="w-10 h-10" />}
                        title="Team Collaboration"
                        description="Multi-tenant workspaces with role-based access control"
                    />
                </section>

                {/* CTA */}
                <section className="text-center">
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to manage your databases?
                        </h2>
                        <p className="text-gray-300 text-lg mb-8">
                            Start with PostgreSQL support. MySQL and MongoDB coming soon.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                            Launch Dashboard
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}
