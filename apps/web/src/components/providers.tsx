'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    // Fallback Client ID for development if env is missing
    // In production, user must provide NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '123456789-placeholder.apps.googleusercontent.com';

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}
