import { NextRequest, NextResponse } from 'next/server';
import { AdapterFactory } from '@bosdb/db-adapters';
import { decryptCredentials } from '@bosdb/security';
import { validateQuery, isReadOnlyQuery } from '@bosdb/security';
import { Logger } from '@bosdb/utils';
import type { QueryRequest } from '@bosdb/core';
import { connections, adapterInstances } from '@/lib/store';

const logger = new Logger('QueryAPI');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { connectionId, query, timeout, maxRows } = body;

        if (!connectionId || !query) {
            return NextResponse.json(
                { error: 'Missing connectionId or query' },
                { status: 400 }
            );
        }

        // Debug: Log connection ID and available connections
        logger.info(`Looking for connection: ${connectionId}`);
        logger.info(`Available connections: ${Array.from(connections.keys()).join(', ')}`);
        logger.info(`Total connections in store: ${connections.size}`);

        // Get connection info
        const connectionInfo = connections.get(connectionId);
        if (!connectionInfo) {
            logger.error(`Connection ${connectionId} not found in store`);
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        // Validate query for SQL injection
        const validation = validateQuery(query);
        if (!validation.safe) {
            logger.warn(`Unsafe query blocked: ${validation.reason}`, validation.patterns);
            return NextResponse.json(
                {
                    error: 'Unsafe query detected',
                    reason: validation.reason,
                    patterns: validation.patterns,
                },
                { status: 400 }
            );
        }

        // Check if read-only connection allows this query
        if (connectionInfo.readOnly && !isReadOnlyQuery(query)) {
            return NextResponse.json(
                { error: 'Write operations not allowed on read-only connection' },
                { status: 403 }
            );
        }

        // Get or create adapter instance
        let adapter = adapterInstances.get(connectionId);
        let adapterConnectionId = connectionId;

        if (!adapter) {
            adapter = AdapterFactory.create(connectionInfo.type);

            // Decrypt credentials
            const credentials = decryptCredentials(connectionInfo.credentials);

            // Connect to database
            const connectResult = await adapter.connect({
                host: connectionInfo.host,
                port: connectionInfo.port,
                database: connectionInfo.database,
                username: credentials.username,
                password: credentials.password,
                ssl: connectionInfo.ssl,
                readOnly: connectionInfo.readOnly,
            });

            if (!connectResult.success) {
                return NextResponse.json(
                    { error: 'Failed to connect to database' },
                    { status: 500 }
                );
            }

            adapterConnectionId = connectResult.connectionId;
            adapterInstances.set(connectionId, { adapter, adapterConnectionId });
        } else {
            adapterConnectionId = adapter.adapterConnectionId;
            adapter = adapter.adapter;
        }

        // Execute query
        const queryRequest: QueryRequest = {
            connectionId: adapterConnectionId,
            query,
            timeout: timeout || 30000,
            maxRows: maxRows || 1000,
        };

        const result = await adapter.executeQuery(queryRequest);

        logger.info(
            `Query executed: ${query.substring(0, 50)}... (${result.executionTime}ms, ${result.rowCount} rows)`
        );

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        logger.error('Query execution failed', error);
        return NextResponse.json(
            {
                error: 'Query execution failed',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
