import { NextRequest, NextResponse } from 'next/server';
import { stepDebugSession } from '@/lib/debug-engine';

export async function POST(
    _request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    const sessionId = params.sessionId;
    console.log('[API] Step request for session:', sessionId);

    try {
        const result = await stepDebugSession(sessionId);
        console.log('[API] Step result:', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Step error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
