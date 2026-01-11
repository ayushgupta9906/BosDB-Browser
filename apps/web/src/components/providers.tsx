'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <ToastProvider>
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}
