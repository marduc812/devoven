import React from 'react'
import Link from 'next/link'
import { REPOSITORY_URL, THIRD_PARTY_LIBRARIES } from '@/lib/third-party-licenses'

const OpenSourceMainView = () => {
    return (
        <div className='max-w-3xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12'>

            {/* Intro */}
            <div className='flex flex-col gap-4'>
                <h1 className='text-3xl font-light text-gray-900 dark:text-white tracking-tight'>Open source</h1>
                <p className='text-gray-500 dark:text-zinc-400 text-sm leading-relaxed'>
                    DevOven is free software. The whole site, every tool and the logic behind
                    it, is published under the GNU Affero General Public License, version 3 or
                    later. You may run it, study it, change it and share it, as long as anyone
                    you pass it on to, including anyone who uses your copy over a network, gets
                    the same freedoms and the source to go with them.
                </p>
                <p className='text-gray-500 dark:text-zinc-400 text-sm leading-relaxed'>
                    Copyright &copy; {new Date().getFullYear()} marduc812. The DevOven name and
                    logo are not covered by the license.
                </p>
            </div>

            {/* Source */}
            <div className='flex flex-col gap-4'>
                <h2 className='text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400'>Source code</h2>
                <div className='border border-gray-900 dark:border-white/15 divide-y divide-gray-900 dark:divide-white/15'>
                    <a
                        href={REPOSITORY_URL}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex flex-row items-baseline justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'
                    >
                        <span className='text-sm text-gray-900 dark:text-white font-medium'>Repository</span>
                        <span className='text-xs font-mono text-gray-500 dark:text-zinc-400 truncate'>{REPOSITORY_URL.replace('https://', '')}</span>
                    </a>
                    <a
                        href={`${REPOSITORY_URL}/blob/main/LICENSE`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex flex-row items-baseline justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'
                    >
                        <span className='text-sm text-gray-900 dark:text-white font-medium'>Full license text</span>
                        <span className='text-xs font-mono text-gray-500 dark:text-zinc-400'>AGPL-3.0-or-later</span>
                    </a>
                </div>
            </div>

            {/* Libraries */}
            <div className='flex flex-col gap-4'>
                <h2 className='text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400'>
                    Libraries ({THIRD_PARTY_LIBRARIES.length})
                </h2>
                <p className='text-gray-500 dark:text-zinc-400 text-sm leading-relaxed'>
                    These ship in your browser when you use the site. Each stays under its own
                    license, and their authors keep their copyright.
                </p>
                <div className='border border-gray-900 dark:border-white/15 divide-y divide-gray-900 dark:divide-white/15'>
                    {THIRD_PARTY_LIBRARIES.map((library) => (
                        <a
                            key={library.name}
                            href={library.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'
                        >
                            <span className='flex flex-col gap-0.5 min-w-0'>
                                <span className='text-sm font-mono text-gray-900 dark:text-white truncate'>{library.name}</span>
                                <span className='text-xs text-gray-500 dark:text-zinc-400'>{library.used}</span>
                            </span>
                            <span className='text-xs font-mono text-gray-500 dark:text-zinc-400 whitespace-nowrap'>{library.license}</span>
                        </a>
                    ))}
                </div>
                <p className='text-gray-500 dark:text-zinc-400 text-xs leading-relaxed'>
                    react-icons bundles icon sets that carry their own licenses, listed in its
                    repository. gmp-wasm and web3-utils are LGPL: you are free to replace either
                    with your own build, and the source you need to do that is in the repository
                    above.
                </p>
            </div>

            <div>
                <Link
                    href='/'
                    prefetch={false}
                    className='text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors'
                >
                    &larr; Back to the tools
                </Link>
            </div>
        </div>
    )
}

export default OpenSourceMainView
