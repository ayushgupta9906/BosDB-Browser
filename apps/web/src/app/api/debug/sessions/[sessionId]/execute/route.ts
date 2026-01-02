import { NextRequest, NextResponse } from 'next/server';
import { getDebugEngine } from '@/lib/debug-engine';
import { getCurrentUser } from '@/lib/auth';
import { getConnectedAdapter } from '@/lib/db-utils';

interface RouteParams {
    params: {
        sessionId: string;
    };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, parameters, connectionId } = await req.json();
        const debugEngine = getDebugEngine();
        const session = debugEngine.getSession(params.sessionId);

        if (!session || session.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Define the runner that the debugger will use to execute each statement
        const runner = async (sql: string, params?: any[]) => {
            const { adapter } = await getConnectedAdapter(connectionId || session.connectionId);
            return await adapter.query(sql, params);
        };

        // Execute via debug engine (which handles multi-statement stepping/breakpoints)
        const result = await debugEngine.executeQuery(
            params.sessionId,
            query,
            parameters || [],
            runner
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in debug execution:', error);
        return NextResponse.json(
            { error: error.message || 'Execution failed' },
            { status: 500 }
        );
    }
}
