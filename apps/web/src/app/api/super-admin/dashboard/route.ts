
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Organization from '@/models/Organization';
import connectDB from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure no caching for this admin route

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // 1. Auth Check - STRICT SUPER ADMIN ONLY
        // 1. Auth Check - STRICT SUPER ADMIN ONLY
        const userEmail = request.headers.get('x-user-email');
        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized: Missing email' }, { status: 403 });
        }

        // Allow original super admin or any user with 'super-admin' role
        const requestingUser = await User.findOne({ email: userEmail }).lean();
        const isSuperAdmin = userEmail === 'ayush@bosdb.com' || (requestingUser && requestingUser.role === 'super-admin');

        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin' }, { status: 403 });
        }

        // 2. Fetch All Data
        const [users, organizations] = await Promise.all([
            User.find({}).lean(),
            Organization.find({}).lean()
        ]);

        // 3. Aggregate Stats
        const totalUsers = users.length;
        const totalOrgs = organizations.length;

        // Count users per organization
        const userCounts: Record<string, number> = {};
        users.forEach((u: any) => {
            if (u.organizationId) {
                userCounts[u.organizationId] = (userCounts[u.organizationId] || 0) + 1;
            }
        });

        // 4. Map Organizations with Counts and Users
        // We embed users for the expanded view
        const orgsWithDetails = organizations.map((org: any) => {
            const orgUsers = users.filter((u: any) => u.organizationId === org.id);

            return {
                id: org.id,
                name: org.name,
                domain: org.domain,
                type: org.type,
                plan: org.subscription?.plan || 'free',
                status: org.status || 'active', // Default to active if missing
                createdAt: org.createdAt,
                userCount: orgUsers.length,
                users: orgUsers.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    status: u.status
                }))
            };
        });

        // 5. Fetch System Settings (Singleton)
        const SystemSettings = (await import('@/models/SystemSettings')).default;
        let settings = await SystemSettings.findOne({ id: 'global_settings' }).lean();

        if (!settings) {
            // Create default
            settings = await SystemSettings.create({
                id: 'global_settings',
                maintenanceMode: false,
                allowSignup: false,
                betaFeatures: false,
                broadcastMessage: ''
            });
            // Convert to plain object if needed, but create returns document
            settings = (settings as any).toObject ? (settings as any).toObject() : settings;
        }

        return NextResponse.json({
            stats: {
                totalUsers,
                totalOrgs,
                lastUpdated: new Date()
            },
            organizations: orgsWithDetails,
            settings: settings,
            users: users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status
            }))
        });

    } catch (error: any) {
        console.error('[SuperAdmin] Dashboard Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
