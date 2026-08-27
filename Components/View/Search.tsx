'use client'

import React, { useEffect, useState } from 'react'
import { menu } from '@/menu';
import Link from 'next/link';
import { IoSearchOutline } from 'react-icons/io5';
import { MenuColorVariantKeys } from '@/types';

type SearchResult = {
    name: string;
    link: string;
    type: string;
    color: MenuColorVariantKeys;
};

const categoryAccent: Record<string, string> = {
    yellow:  'bg-amber-400',
    teal:    'bg-teal-400',
    cyan:    'bg-indigo-400',
    lime:    'bg-emerald-400',
    fuchsia: 'bg-fuchsia-400',
    rose:    'bg-rose-400',
    sky:     'bg-sky-400',
    violet: 'bg-violet-400',
    red: 'bg-red-400',
};

const SearchView = () => {
    const [search, setSearch] = useState('')
    const [result, setResults] = useState<SearchResult[]>([])

    useEffect(() => {
        const searchParams = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        const from = searchParams.get('term') ?? '';
        if (from != '') handleSearchChange(from);
    }, []);

    const handleSearchChange = (userInput: string) => {
        setSearch(userInput);
        if (userInput.trim() !== '') {
            const filteredResults: SearchResult[] = [];
            menu.forEach(group => {
                group.links.forEach(link => {
                    if (link.name.toLowerCase().includes(userInput.toLowerCase()) || link.type.toLowerCase().includes(userInput.toLowerCase())) {
                        filteredResults.push({ name: link.name, link: link.link, type: link.type, color: group.color });
                    }
                });
            });
            setResults(filteredResults);
        } else {
            setResults([]);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="border-b border-gray-900 px-8 md:px-12 py-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-6">Search</h1>
                <div className="flex items-center border border-gray-900 max-w-xl">
                    <IoSearchOutline className="text-gray-400 text-lg ml-4 flex-shrink-0" />
                    <input
                        placeholder='Search for a tool...'
                        defaultValue={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className='text-gray-900 text-base bg-white px-4 py-3 w-full placeholder:text-gray-400 focus:outline-none'
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            <div className="px-8 md:px-12 py-8">
                {result.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-gray-200">
                        {result.map((item, index) => {
                            const accent = categoryAccent[item.color as string] ?? categoryAccent.yellow;
                            return (
                                <Link href={item.link} key={index} prefetch={false}>
                                    <div className="relative p-4 flex flex-col bg-white hover:bg-gray-50 transition-colors duration-100 h-full">
                                        <span className={`absolute top-0 left-0 w-full h-0.5 ${accent}`} />
                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">{item.type}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : search.trim() === '' ? (
                    <div className='flex flex-col w-full items-center justify-center mt-24 gap-4'>
                        <IoSearchOutline className="text-5xl text-gray-200" />
                        <p className='text-sm text-gray-400 uppercase tracking-wide font-medium'>Search across 650+ developer tools</p>
                    </div>
                ) : (
                    <div className='flex flex-col w-full items-center justify-center mt-24 gap-3'>
                        <IoSearchOutline className="text-5xl text-gray-200" />
                        <p className='text-gray-900 text-sm font-bold uppercase tracking-wide'>No results for &ldquo;{search}&rdquo;</p>
                        <p className='text-gray-400 text-xs'>Try a different search term</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchView
