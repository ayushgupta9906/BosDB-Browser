/**
 * Organization Members API
 * GET /api/org/members - List all members of an organization
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        const orgId = req.nextUrl.searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
        }

        await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        const usersCollection = db.collection('users');

        // Find all users in this organization
        const users = await usersCollection.find({
            organizationId: orgId
        }).toArray();

        const members = users.map((user: any) => ({
            id: user._id.toString(),
            name: user.name || user.email?.split('@')[0] || 'Unknown',
            email: user.email,
            role: user.role || 'Member',
            status: 'offline', // Could be enhanced with real-time presence
            permissions: user.permissions || ['read'],
            createdAt: user.createdAt
        }));

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Failed to fetch org members:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userEmail = req.headers.get('x-user-email');
        const orgId = req.headers.get('x-org-id');

        if (!userEmail || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, role, permissions } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        const usersCollection = db.collection('users');

        // Check if inviter is admin
        const inviter = await usersCollection.findOne({ email: userEmail, organizationId: orgId });
        if (!inviter || !['admin', 'owner'].includes(inviter.role as string)) {
            return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
        }

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email, organizationId: orgId });
        if (existingUser) {
            return NextResponse.json({ error: 'User already in organization' }, { status: 400 });
        }

        // Create new member (or invite if they don't exist yet)
        const newMember = {
            email,
            name: email.split('@')[0],
            organizationId: orgId,
            organizationName: inviter.organizationName,
            role: role || 'Member',
            permissions: permissions || ['read'],
            invitedBy: userEmail,
            createdAt: new Date(),
            status: 'pending'
        };

        await usersCollection.insertOne(newMember);

        return NextResponse.json({
            success: true,
            member: {
                email: newMember.email,
                name: newMember.name,
                role: newMember.role,
                permissions: newMember.permissions
            }
        });
    } catch (error) {
        console.error('Failed to add member:', error);
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}

// Update member permissions
export async function PATCH(req: NextRequest) {
    try {
        const userEmail = req.headers.get('x-user-email');
        const orgId = req.headers.get('x-org-id');

        if (!userEmail || !orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { memberEmail, role, permissions } = body;

        if (!memberEmail) {
            return NextResponse.json({ error: 'Member email required' }, { status: 400 });
        }

        await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
        }

        const usersCollection = db.collection('users');

        // Check if updater is admin
        const updater = await usersCollection.findOne({ email: userEmail, organizationId: orgId });
        if (!updater || !['admin', 'owner'].includes(updater.role as string)) {
            return NextResponse.json({ error: 'Only admins can update members' }, { status: 403 });
        }

        // Update member
        const updateFields: Record<string, unknown> = {};
        if (role) updateFields.role = role;
        if (permissions) updateFields.permissions = permissions;

        await usersCollection.updateOne(
            { email: memberEmail, organizationId: orgId },
            { $set: updateFields }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update member:', error);
        return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
}
