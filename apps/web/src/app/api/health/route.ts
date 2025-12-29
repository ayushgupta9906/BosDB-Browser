// Health check endpoint for Render
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'BosDB-Browser'
        },
        { status: 200 }
    );
}
