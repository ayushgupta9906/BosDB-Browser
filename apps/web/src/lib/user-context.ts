import { getCurrentUser } from './auth';

export { getCurrentUser };

export function promptForUserIfNeeded() {
    const user = getCurrentUser();

    if (!user) {
        // Redirect to login if not logged in
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return { name: 'Guest', email: 'guest@bosdb.com' };
    }

    return {
        name: user.name,
        email: user.email,
        userId: user.id  // Include user ID for tracking
    };
}
