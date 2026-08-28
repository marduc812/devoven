'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MenuLinkType } from '@/types';
import { extractTargetSlug, getPathSuggestions } from '@/Components/Functions/PathSuggestions';

export default function NotFound() {

    const pathname = usePathname();

    // The 404 shell is prerendered without a URL, so the requested path is only
    // known once we're on the client - match it after mount.
    const [suggestions, setSuggestions] = useState<MenuLinkType[]>([]);
    const [searchHref, setSearchHref] = useState('/search');

    useEffect(() => {
        const matches = getPathSuggestions(pathname);
        setSuggestions(matches);

        // With nothing to suggest, hand the guessed slug to the search page
        // instead of dropping the user on an empty search box.
        const term = extractTargetSlug(pathname).slug.replace(/-/g, ' ');
        setSearchHref(matches.length === 0 && term !== ''
            ? `/search?term=${encodeURIComponent(term)}`
            : '/search');
    }, [pathname]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="flex flex-col items-center text-center gap-8 max-w-md w-full">

                {/* 404 */}
                <div className="relative">
                    <span className="text-[9rem] font-bold leading-none text-gray-100 dark:text-white/[0.06] select-none pointer-events-none">
                        404
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-light text-gray-900 tracking-tight">404</span>
                    </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                    <p className="text-gray-900 text-xl font-light">Page not found</p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="flex flex-col items-center gap-3 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Did you mean?</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((suggestion, index) => (
                                <Link
                                    key={index}
                                    href={suggestion.link}
                                    prefetch={false}
                                    className="px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
                                >
                                    {suggestion.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        prefetch={false}
                        className="px-5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
                    >
                        Go Home
                    </Link>
                    <Link
                        href={searchHref}
                        prefetch={false}
                        className="px-5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
                    >
                        Search Tools
                    </Link>
                </div>

            </div>
        </div>
    );
}
