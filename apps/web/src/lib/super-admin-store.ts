import connectDB from './db';
import SuperAdmin, { ISuperAdmin } from '@/models/SuperAdmin';
import { hashPassword } from './auth';

/**
 * Get all Super Admins
 */
export async function getSuperAdmins(): Promise<ISuperAdmin[]> {
    await connectDB();
    const admins = await SuperAdmin.find({}).lean();
    return admins.map(admin => ({
        ...admin,
        _id: undefined,
    })) as ISuperAdmin[];
}

/**
 * Find Super Admin by email
 */
export async function findSuperAdminByEmail(email: string): Promise<ISuperAdmin | null> {
    await connectDB();
    const admin = await SuperAdmin.findOne({ email }).lean();
    if (!admin) return null;

    return {
        ...admin,
        _id: undefined,
    } as ISuperAdmin;
}

/**
 * Find Super Admin by ID
 */
export async function findSuperAdminById(id: string): Promise<ISuperAdmin | null> {
    await connectDB();
    const admin = await SuperAdmin.findOne({ id }).lean();
    if (!admin) return null;

    return {
        ...admin,
        _id: undefined,
    } as ISuperAdmin;
}

/**
 * Create a new Super Admin
 */
export async function createSuperAdmin(data: Omit<ISuperAdmin, 'createdAt'>): Promise<ISuperAdmin> {
    await connectDB();
    const admin = await SuperAdmin.create({
        ...data,
        createdAt: new Date(),
    });

    return {
        ...admin.toObject(),
        _id: undefined,
    } as ISuperAdmin;
}

/**
 * Update Super Admin
 */
export async function updateSuperAdmin(id: string, updates: Partial<ISuperAdmin>): Promise<ISuperAdmin | null> {
    await connectDB();
    const admin = await SuperAdmin.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
    ).lean();

    if (!admin) return null;

    return {
        ...admin,
        _id: undefined,
    } as ISuperAdmin;
}

/**
 * Seed default Super Admin if not exists
 */
export async function seedDefaultSuperAdmin(): Promise<void> {
    const existing = await findSuperAdminByEmail('ayush@bosdb.com');
    const newPassword = await hashPassword('Arush098!');

    if (!existing) {
        console.log('[SuperAdmin] Seeding ayush@bosdb.com as super admin...');

        await createSuperAdmin({
            id: 'super-admin-ayush',
            email: 'ayush@bosdb.com',
            name: 'Ayush (BosDB Owner)',
            password: newPassword,
            role: 'super-admin',
            status: 'active',
        });

        console.log('[SuperAdmin] ayush@bosdb.com created successfully');
    } else {
        // Always update password to latest
        await updateSuperAdmin(existing.id, { password: newPassword });
        console.log('[SuperAdmin] Password updated for ayush@bosdb.com');
    }
}

