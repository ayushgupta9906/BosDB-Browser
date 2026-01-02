/**
 * QueryTabs Component
 * Tab bar for managing multiple SQL query tabs
 */

'use client';

import { X, Plus, FileText } from 'lucide-react';

export interface QueryTab {
    id: string;
    name: string;
    query: string;
    breakpoints: number[];
    isDirty?: boolean;
}

interface QueryTabsProps {
    tabs: QueryTab[];
    activeIndex: number;
    onTabChange: (index: number) => void;
    onTabClose: (index: number) => void;
    onTabAdd: () => void;
    onTabRename?: (index: number, newName: string) => void;
}

export default function QueryTabs({
    tabs,
    activeIndex,
    onTabChange,
    onTabClose,
    onTabAdd,
    onTabRename
}: QueryTabsProps) {

    const handleDoubleClick = (index: number) => {
        if (!onTabRename) return;

        const newName = prompt('Rename tab:', tabs[index].name);
        if (newName && newName.trim()) {
            onTabRename(index, newName.trim());
        }
    };

    return (
        <div className="flex items-center gap-0.5 border-b border-border bg-accent/30 px-2 overflow-x-auto">
            {tabs.map((tab, index) => (
                <div
                    key={tab.id}
                    className={`
            flex items-center gap-2 px-3 py-2 cursor-pointer
            transition-colors min-w-[100px] max-w-[180px] group relative
            ${index === activeIndex
                            ? 'bg-background text-foreground border-t-2 border-t-primary'
                            : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                        }
          `}
                    onClick={() => onTabChange(index)}
                    onDoubleClick={() => handleDoubleClick(index)}
                >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 truncate text-xs">
                        {tab.name}
                        {tab.isDirty && <span className="text-orange-500 ml-0.5">•</span>}
                    </span>

                    {tabs.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTabClose(index);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded transition"
                            title="Close tab"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}

            <button
                onClick={onTabAdd}
                className="p-2 hover:bg-accent rounded transition flex-shrink-0"
                title="New Query Tab (Ctrl+T)"
            >
                <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    );
}
