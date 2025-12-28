import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// POST /api/vcs/pending - Track a new change
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { connectionId, change } = body;

        if (!connectionId || !change) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure directory exists
        const vcsDir = path.join(process.cwd(), '.bosdb-vcs', connectionId);
        await fs.mkdir(vcsDir, { recursive: true });

        // Store pending change
        const pendingChangesPath = path.join(vcsDir, 'pending.json');

        let pending: { changes: any[] } = { changes: [] };
        try {
            const data = await fs.readFile(pendingChangesPath, 'utf-8');
            pending = JSON.parse(data);
        } catch {
            // File doesn't exist yet, use empty array
        }

        pending.changes.push({
            ...change,
            timestamp: new Date().toISOString(),
            id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        await fs.writeFile(pendingChangesPath, JSON.stringify(pending, null, 2));

        return NextResponse.json({ success: true, pending });
    } catch (error) {
        console.error('VCS pending error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// GET /api/vcs/pending?connectionId=xxx
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
        return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    try {
        const vcsDir = path.join(process.cwd(), '.bosdb-vcs', connectionId);
        const pendingChangesPath = path.join(vcsDir, 'pending.json');

        try {
            const data = await fs.readFile(pendingChangesPath, 'utf-8');
            const pending = JSON.parse(data);
            return NextResponse.json(pending);
        } catch {
            return NextResponse.json({ changes: [] });
        }
    } catch (error) {
        console.error('VCS get pending error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE /api/vcs/pending - Clear all pending changes
export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
        return NextResponse.json({ error: 'Connection ID required' }, { status: 400 });
    }

    try {
        const vcsDir = path.join(process.cwd(), '.bosdb-vcs', connectionId);
        await fs.mkdir(vcsDir, { recursive: true });

        const pendingChangesPath = path.join(vcsDir, 'pending.json');
        await fs.writeFile(pendingChangesPath, JSON.stringify({ changes: [] }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('VCS delete pending error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
