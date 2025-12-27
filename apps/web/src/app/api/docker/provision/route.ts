import { NextRequest, NextResponse } from 'next/server';
import { pullAndStartDatabase, DatabaseType, checkDockerAvailable } from '@/lib/docker-manager';
import { getCurrentUser } from '@/lib/auth';

// POST /api/docker/provision - Create and start a new Docker database
export async function POST(request: NextRequest) {
    try {
        // Get current user from headers (sent by frontend)
        const userEmail = request.headers.get('x-user-email');
        if (!userEmail) {
            return NextResponse.json({ error: 'User email required' }, { status: 401 });
        }

        // Find user to get organization ID
        const { findUserByEmail } = await import('@/lib/users-store');
        const user = findUserByEmail(userEmail);
        if (!user || !user.organizationId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { type, name, autoStart } = body;

        // Validate inputs
        if (!type || !name) {
            return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
        }

        const validTypes: DatabaseType[] = ['postgres', 'mysql', 'mongodb', 'redis'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid database type' }, { status: 400 });
        }

        // Check Docker is available
        const isDockerAvailable = await checkDockerAvailable();
        if (!isDockerAvailable) {
            return NextResponse.json({
                error: 'Docker is not running. Please start Docker and try again.'
            }, { status: 503 });
        }

        console.log(`[Docker API] Creating ${type} database "${name}" for org ${user.organizationId}`);

        // Create the database (this will pull image, create container, start it)
        const database = await pullAndStartDatabase(
            type,
            name,
            user.organizationId,
            autoStart !== false // Default to true
        );

        console.log(`[Docker API] Successfully created database: ${database.id}`);

        return NextResponse.json({
            success: true,
            database: {
                id: database.id,
                type: database.type,
                name: database.name,
                port: database.port,
                username: database.username,
                password: database.password,
                database: database.database,
                status: database.status,
                connectionString: getConnectionString(database)
            }
        });

    } catch (error: any) {
        console.error('[Docker API] Failed to provision database:', error);
        return NextResponse.json({
            error: error.message || 'Failed to provision database'
        }, { status: 500 });
    }
}

// Helper to generate connection strings
function getConnectionString(db: any): string {
    switch (db.type) {
        case 'postgres':
            return `postgresql://${db.username}:${db.password}@localhost:${db.port}/${db.database}`;
        case 'mysql':
            return `mysql://${db.username}:${db.password}@localhost:${db.port}/${db.database}`;
        case 'mongodb':
            return `mongodb://${db.username}:${db.password}@localhost:${db.port}/${db.database}`;
        case 'redis':
            return `redis://localhost:${db.port}`;
        default:
            return '';
    }
}
