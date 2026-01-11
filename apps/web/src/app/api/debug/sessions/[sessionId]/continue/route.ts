import { NextRequest, NextResponse } from 'next/server';
import { continueDebugSession } from '@/lib/debug-engine';

export async function POST(
    _request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    const sessionId = params.sessionId;
    console.log('[API] Continue request for session:', sessionId);

    try {
        const result = await continueDebugSession(sessionId);
        console.log('[API] Continue result:', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Continue error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
