import { useState } from 'react';
import { Save, X, Download, Database } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

interface SaveQueryModalProps {
    query: string;
    connectionId: string;
    onClose: () => void;
    onSuccess: (savedQuery: any) => void;
}

type SaveMode = 'database' | 'file';

export function SaveQueryModal({ query, connectionId, onClose, onSuccess }: SaveQueryModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saveMode, setSaveMode] = useState<SaveMode>('database');

    const handleSaveToDatabase = async () => {
        setSaving(true);
        setError('');

        try {
            const user = getCurrentUser();
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (user?.email) headers['x-user-email'] = user.email;
            if (user?.organizationId) headers['x-org-id'] = user.organizationId;

            const res = await fetch('/api/saved-queries', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    description,
                    query,
                    connectionId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save query');
            }

            onSuccess(data.query);
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    const handleDownloadAsFile = () => {
        const filename = `${name || 'query'}.sql`;
        const header = `-- ${name}\n-- ${description || 'No description'}\n-- Saved: ${new Date().toISOString()}\n\n`;
        const content = header + query;

        const blob = new Blob([content], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (saveMode === 'database') {
            await handleSaveToDatabase();
        } else {
            handleDownloadAsFile();
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Save className="w-4 h-4 text-primary" />
                        Save Query
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-accent rounded transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Save Mode Selection */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSaveMode('database')}
                            className={`flex-1 p-3 rounded-lg border transition flex flex-col items-center gap-2 ${saveMode === 'database'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-accent'
                                }`}
                        >
                            <Database className="w-5 h-5" />
                            <span className="text-sm font-medium">Save to BosDB</span>
                            <span className="text-[10px] text-muted-foreground">Access from anywhere</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSaveMode('file')}
                            className={`flex-1 p-3 rounded-lg border transition flex flex-col items-center gap-2 ${saveMode === 'file'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-accent'
                                }`}
                        >
                            <Download className="w-5 h-5" />
                            <span className="text-sm font-medium">Download as File</span>
                            <span className="text-[10px] text-muted-foreground">Save to your computer</span>
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                            placeholder={saveMode === 'file' ? 'filename (without .sql)' : 'My Query'}
                            required
                            autoFocus
                        />
                    </div>

                    {saveMode === 'database' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary resize-none h-20"
                                placeholder="What does this query do?"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Query Preview</label>
                        <pre className="text-xs font-mono bg-muted p-2 rounded border border-border overflow-x-auto max-h-24">
                            {query.slice(0, 300)}{query.length > 300 ? '...' : ''}
                        </pre>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm hover:bg-accent rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !name.trim()}
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {saveMode === 'database' ? (
                                <>
                                    <Database className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save to BosDB'}
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download .sql
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
