import fs from 'fs';
import path from 'path';
import { User } from './auth';

const USERS_FILE = path.join(process.cwd(), '.bosdb-users.json');

// Get all users from storage
export function getUsers(): User[] {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[UsersStore] Failed to load users:', error);
    }

    // Return default admin if no users exist
    return [{
        id: 'admin',
        name: 'Administrator',
        email: 'admin@bosdb.com',
        role: 'admin',
        status: 'approved',
        createdAt: new Date(),
        password: 'admin' // Default password, should be changed
    } as any]; // Use any to bypass password check until User model is updated
}

// Save users to storage
export function saveUsers(users: User[]) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('[UsersStore] Failed to save users:', error);
    }
}

// Find user by ID
export function findUserById(id: string): User | undefined {
    return getUsers().find(u => u.id === id);
}

// Find user by email
export function findUserByEmail(email: string): User | undefined {
    return getUsers().find(u => u.email === email);
}

// Create new user
export function createUser(user: User) {
    const users = getUsers();
    if (users.some(u => u.id === user.id || u.email === user.email)) {
        throw new Error('User already exists');
    }
    users.push(user);
    saveUsers(users);
    return user;
}

// Update user
export function updateUser(id: string, updates: Partial<User>) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        throw new Error('User not found');
    }

    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
}
