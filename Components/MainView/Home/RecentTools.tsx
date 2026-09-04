'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IoArrowForward, IoClose } from 'react-icons/io5';
import { menu } from '@/menu';
import { ToolUsage, clearUsage, readUsage } from '@/lib/recentTools';

/**
 * The grid paints its own gaps, so a half-filled last row leaves grey holes.
 * Show only a count that fills its rows, and pick the columns to match.
 * Storage keeps far more than this.
 */
function fitToGrid(total: number): { shown: number; columns: string } {
    if (total >= 6) return { shown: 6, columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' };
    if (total >= 3) return { shown: 3, columns: 'grid-cols-1 sm:grid-cols-3' };
    if (total === 2) return { shown: 2, columns: 'grid-cols-1 sm:grid-cols-2' };
    return { shown: 1, columns: 'grid-cols-1' };
}

const categoryAccent: Record<string, string> = {
    yellow: 'bg-amber-400',
    teal: 'bg-teal-400',
    cyan: 'bg-indigo-400',
    lime: 'bg-emerald-400',
    rose: 'bg-rose-400',
    sky: 'bg-sky-400',
    violet: 'bg-violet-400',
    red: 'bg-red-400',
    fuchsia: 'bg-fuchsia-400',
};

const accentByCategory = new Map(
    menu.map((group) => [group.name, categoryAccent[group.color] ?? categoryAccent.yellow])
);

const RecentTools = () => {
    // Empty on the server: usage lives in localStorage, so the first paint has
    // nothing to show and the section appears once the client reads it.
    const [tools, setTools] = useState<ToolUsage[]>([]);

    useEffect(() => {
        setTools(readUsage());
    }, []);

    if (tools.length === 0) return null;

    const { shown, columns } = fitToGrid(tools.length);

    const onClear = () => {
        clearUsage();
        setTools([]);
    };

    return (
        <div className="border-b border-gray-200">
            <div className="flex items-center gap-3 px-8 md:px-12 py-4 border-b border-gray-100">
                <span className="w-3 h-3 bg-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900">Recently Used</span>
                <span className="text-gray-400 text-xs ml-1">
                    {shown === tools.length ? `${tools.length} tools` : `${shown} of ${tools.length}`}
                </span>
                <button
                    onClick={onClear}
                    className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <IoClose size={12} />
                    Clear
                </button>
            </div>

            <div className="px-8 md:px-12 py-6">
                <div className={`grid ${columns} gap-px bg-gray-200`}>
                    {tools.slice(0, shown).map((tool) => (
                        <Link key={tool.link} href={tool.link} prefetch={false} className="group">
                            <div className="bg-white hover:bg-gray-50 transition-colors duration-100 p-5 h-full flex items-center gap-4">
                                <span className={`w-2 h-8 flex-shrink-0 ${accentByCategory.get(tool.category) ?? categoryAccent.yellow}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{tool.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                                        {tool.category} · {tool.count} {tool.count === 1 ? 'use' : 'uses'}
                                    </p>
                                </div>
                                <IoArrowForward size={14} className="text-gray-400 group-hover:text-gray-900 flex-shrink-0 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecentTools;
