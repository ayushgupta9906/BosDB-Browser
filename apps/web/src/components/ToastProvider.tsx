'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const contextValue: ToastContextType = {
        showToast,
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
        info: (msg) => showToast(msg, 'info'),
        warning: (msg) => showToast(msg, 'warning'),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
    };

    const colors = {
        success: 'bg-green-500/90 text-white border-green-600',
        error: 'bg-red-500/90 text-white border-red-600',
        info: 'bg-blue-500/90 text-white border-blue-600',
        warning: 'bg-yellow-500/90 text-white border-yellow-600',
    };

    return (
        <div
            className={`${colors[toast.type]} pointer-events-auto backdrop-blur-md border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right-5 fade-in duration-300`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onClose}
                className="hover:bg-white/20 rounded p-1 transition"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
