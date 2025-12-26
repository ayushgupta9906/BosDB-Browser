// User authentication and management
export interface User {
    id: string;          // e.g., "ayush-g", "yuval.o"
    name: string;        // Full name
    email: string;
    role: 'admin' | 'user';
    createdAt: Date;
}

const USERS_STORAGE_KEY = 'bosdb_users';
const CURRENT_USER_KEY = 'bosdb_current_user';

// Get all users
export function getAllUsers(): User[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Get current logged-in user
export function getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
}

// Login user
export function login(userId: string): User | null {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);

    if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    }

    return null;
}

// Register new user (admin function)
export function registerUser(user: Omit<User, 'createdAt'>): void {
    const users = getAllUsers();

    // Check if user ID already exists
    if (users.some(u => u.id === user.id)) {
        throw new Error('User ID already exists');
    }

    const newUser: User = {
        ...user,
        createdAt: new Date(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Logout
export function logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Initialize with default admin user
export function initializeDefaultUsers(): void {
    const users = getAllUsers();

    if (users.length === 0) {
        // Create default admin
        const admin: User = {
            id: 'admin',
            name: 'Administrator',
            email: 'admin@bosdb.com',
            role: 'admin',
            createdAt: new Date(),
        };

        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([admin]));
    }
}

// Check if user is logged in
export function isAuthenticated(): boolean {
    return getCurrentUser() !== null;
}

// Check if current user is admin
export function isAdmin(): boolean {
    const user = getCurrentUser();
    return user?.role === 'admin';
}
