/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['@bosdb/core', '@bosdb/db-adapters', '@bosdb/security', '@bosdb/utils'],
    serverExternalPackages: [
        'pg',
        'mysql2',
        'lru.min',
        'seq-queue',
        'aws-ssl-profiles',
        'long',
        'named-placeholders'
    ],
    // Remove output setting to allow server-side rendering
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
