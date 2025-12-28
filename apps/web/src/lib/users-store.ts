import fs from 'fs';
import path from 'path';
import { User } from './auth';
import { getOrgDataDir } from './organization';

// Get organization-specific users file path
function getUsersFilePath(orgId: string): string {
    const orgDir = getOrgDataDir(orgId);
    return path.join(orgDir, 'users.json');
}

// Get all users from an organization
export function getUsersByOrg(orgId: string): User[] {
    try {
        const filePath = getUsersFilePath(orgId);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`[UsersStore] Failed to load users for org ${orgId}:`, error);
    }
    return [];
}

// Get ALL users (across all organizations) - for migration/admin purposes
export function getUsers(): User[] {
    // For backward compatibility, try to load from old location first
    const OLD_USERS_FILE = path.join(process.cwd(), '.bosdb-users.json');
    try {
        if (fs.existsSync(OLD_USERS_FILE)) {
            const data = fs.readFileSync(OLD_USERS_FILE, 'utf-8');
            const users = JSON.parse(data);
            console.log('[UsersStore] Loaded users from legacy file');
            return users;
        }
    } catch (error) {
        console.error('[UsersStore] Failed to load legacy users:', error);
    }

    // Return default admin if no users exist
    return [{
        id: 'admin',
        name: 'Administrator',
        email: 'admin@bosdb.com',
        role: 'admin',
        status: 'approved',
        accountType: 'individual',
        organizationId: 'ind-admin',
        createdAt: new Date(),
        password: 'admin'
    } as any];
}

// Save users for an organization
function saveUsersByOrg(orgId: string, users: User[]) {
    try {
        const filePath = getUsersFilePath(orgId);
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error(`[UsersStore] Failed to save users for org ${orgId}:`, error);
    }
}

// Save users to old location (for backward compatibility during migration)
export function saveUsers(users: User[]) {
    const OLD_USERS_FILE = path.join(process.cwd(), '.bosdb-users.json');
    try {
        fs.writeFileSync(OLD_USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('[UsersStore] Failed to save users:', error);
    }
}

// Find user by ID (searches all orgs from legacy file)
export function findUserById(id: string): User | undefined {
    return getUsers().find(u => u.id === id);
}

// Find user by ID within a specific organization
export function findUserByIdInOrg(id: string, orgId: string): User | undefined {
    return getUsersByOrg(orgId).find(u => u.id === id);
}

// Find user by email (searches all orgs from legacy file)
export function findUserByEmail(email: string): User | undefined {
    return getUsers().find(u => u.email === email);
}

// Find user by email within a specific organization
export function findUserByEmailInOrg(email: string, orgId: string): User | undefined {
    return getUsersByOrg(orgId).find(u => u.email === email);
}

// Create new user in their organization
export function createUser(user: User) {
    if (!user.organizationId) {
        throw new Error('User must have an organizationId');
    }

    // Check in the user's org
    const orgUsers = getUsersByOrg(user.organizationId);
    if (orgUsers.some(u => u.id === user.id || u.email === user.email)) {
        throw new Error('User already exists in organization');
    }

    orgUsers.push(user);
    saveUsersByOrg(user.organizationId, orgUsers);

    // Also save to legacy file for backward compatibility
    const allUsers = getUsers();
    allUsers.push(user);
    saveUsers(allUsers);

    return user;
}

// Update user in their organization
export function updateUser(id: string, updates: Partial<User>) {
    const allUsers = getUsers();
    const userIndex = allUsers.findIndex(u => u.id === id);

    if (userIndex === -1) {
        throw new Error('User not found');
    }

    const user = allUsers[userIndex];
    const orgId = user.organizationId;

    if (!orgId) {
        // Legacy user without org - just update in main file
        allUsers[userIndex] = { ...user, ...updates };
        saveUsers(allUsers);
        return allUsers[userIndex];
    }

    // Update in organization-specific file
    const orgUsers = getUsersByOrg(orgId);
    const orgUserIndex = orgUsers.findIndex(u => u.id === id);

    if (orgUserIndex !== -1) {
        orgUsers[orgUserIndex] = { ...orgUsers[orgUserIndex], ...updates };
        saveUsersByOrg(orgId, orgUsers);
    }

    // Also update in legacy file
    allUsers[userIndex] = { ...user, ...updates };
    saveUsers(allUsers);

    return allUsers[userIndex];
}
