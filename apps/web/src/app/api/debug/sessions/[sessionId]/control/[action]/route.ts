/**
 * Debug API - Control Operations
 * POST /api/debug/sessions/[sessionId]/control/[action]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDebugEngine } from '@/lib/debug-engine';
import { getCurrentUser } from '@/lib/auth';
import { getConnectedAdapter } from '@/lib/db-utils';

interface RouteParams {
    params: {
        sessionId: string;
        action: string;
    };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, action } = params;
        const debugEngine = getDebugEngine();
        const session = debugEngine.getSession(sessionId);

        if (!session || session.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        switch (action) {
            case 'resume':
                debugEngine.resume(sessionId);
                break;
            case 'pause':
                debugEngine.pause(sessionId);
                break;
            case 'step':
                await debugEngine.stepOver(sessionId);
                break;
            case 'stepInto':
                await debugEngine.stepInto(sessionId);
                break;
            case 'stepOut':
                await debugEngine.stepOut(sessionId);
                break;
            case 'rewind':
                await debugEngine.rewind(sessionId, async (sql: string) => {
                    const { adapter } = await getConnectedAdapter(session.connectionId);
                    return await adapter.query(sql);
                });
                break;
            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, status: session.state.status });
    } catch (error: any) {
        console.error(`Error performing debug action ${params.action}:`, error);
        return NextResponse.json(
            { error: error.message || 'Action failed' },
            { status: 500 }
        );
    }
}
