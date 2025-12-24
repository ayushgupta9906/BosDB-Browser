import { NextRequest, NextResponse } from 'next/server';
import { AdapterFactory } from '@bosdb/db-adapters';
import { decryptCredentials } from '@bosdb/security';
import { Logger } from '@bosdb/utils';
import { connections, adapterInstances } from '@/lib/store';

const logger = new Logger('SchemaAPI');

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const connectionId = searchParams.get('connectionId');

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 });
        }

        const connectionInfo = connections.get(connectionId);
        if (!connectionInfo) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        // Get or create adapter
        let adapterInfo = adapterInstances.get(connectionId);

        if (!adapterInfo) {
            const adapter = AdapterFactory.create(connectionInfo.type);
            const credentials = decryptCredentials(connectionInfo.credentials);

            const connectResult = await adapter.connect({
                name: connectionInfo.name,
                host: connectionInfo.host,
                port: connectionInfo.port,
                database: connectionInfo.database,
                username: credentials.username,
                password: credentials.password,
            });

            if (!connectResult.success) {
                return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
            }

            adapterInfo = { adapter, adapterConnectionId: connectResult.connectionId };
            adapterInstances.set(connectionId, adapterInfo);
        }

        // List schemas
        const schemas = await adapterInfo.adapter.listSchemas(adapterInfo.adapterConnectionId);

        return NextResponse.json({ schemas });
    } catch (error: any) {
        logger.error('Failed to fetch schemas', error);
        return NextResponse.json({ error: 'Failed to fetch schemas' }, { status: 500 });
    }
}
