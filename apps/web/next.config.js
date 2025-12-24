/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@bosdb/core', '@bosdb/db-adapters', '@bosdb/security', '@bosdb/utils'],
    experimental: {
        serverComponentsExternalPackages: ['pg'],
    },
};

module.exports = nextConfig;
