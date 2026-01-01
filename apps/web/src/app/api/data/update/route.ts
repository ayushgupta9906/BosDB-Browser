import { NextRequest, NextResponse } from 'next/server';
import { getConnection, adapterInstances } from '@/lib/store';
import { getConnectedAdapter } from '@/lib/db-utils';
import { generateUpdateStatement } from '@/lib/sql-helper';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { connectionId, schema, table, updates } = body;

        // Basic validation
        if (!connectionId || !schema || !table || !updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
        }

        const connection = await getConnection(connectionId);
        if (!connection) {
            return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }

        // Get adapter instance
        const adapter = await getConnectedAdapter(connectionId);

        // Get the adapter's internal connection ID
        const adapterInfo = adapterInstances.get(connectionId);
        if (!adapterInfo) {
            return NextResponse.json({ error: 'Adapter connection not found' }, { status: 500 });
        }
        const adapterConnectionId = adapterInfo.adapterConnectionId;

        const results = [];
        const errors = [];

        // For this MVP, we execute updates sequentially. 
        // In a real production app, we should use a transaction block (BEGIN...COMMIT).

        for (const update of updates) {
            try {
                const { primaryKey, changes } = update;

                // Generate SQL
                const sql = generateUpdateStatement(schema, table, primaryKey, changes, connection.type);

                // Execute with the correct adapter connection ID
                await adapter.executeQuery({
                    connectionId: adapterConnectionId,
                    query: sql
                });

                results.push({ success: true, primaryKey });
            } catch (err: any) {
                console.error('Update failed:', err);
                errors.push({
                    primaryKey: update.primaryKey,
                    error: err.message
                });
            }
        }

        if (errors.length > 0 && results.length === 0) {
            // All failed
            return NextResponse.json({
                success: false,
                error: 'All updates failed',
                details: errors
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            updatedCount: results.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Batch update error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
