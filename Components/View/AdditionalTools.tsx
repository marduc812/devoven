'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { event } from "@/Components/Functions/gtag";
import { getSuggestions } from '@/Components/Functions/Utils'

/**
 * The related-tool links under every tool.
 *
 * These are rendered during SSR from usePathname(), not from window.location in
 * an effect, and they are real anchors rather than divs that call router.push.
 * Both matter: before this, a crawler saw a tool page linking only to the home
 * page and the footer, so every one of the 600-odd tools was a dead end and
 * nothing passed authority sideways between related tools.
 */
const AdditionalTools = () => {
    const pathname = usePathname();
    const results = getSuggestions(pathname ?? '');

    if (results.length === 0) return null;

    return (
        <div className='py-8'>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Related Tools</h2>
            <nav aria-label="Related tools" className="flex flex-row flex-wrap gap-2">
                {results.map((tool) => (
                    <AdditionalToolView key={tool.link} name={tool.name} link={tool.link} from={pathname ?? ''} />
                ))}
            </nav>
        </div>
    )
}

type AdditionalToolType = {
    name: string;
    link: string;
    from: string;
}

const AdditionalToolView = (props: AdditionalToolType) => {

    const trackClick = () => {
        if (window.location.hostname !== 'localhost') {
            event({
                action: "additional_tools",
                category: "User Interaction",
                label: props.from,
                value: 1,
            });
        }
    }

    return (
        <Link
            href={props.link}
            scroll={false}
            onClick={trackClick}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors duration-150 font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
        >
            {props.name}
        </Link>
    )
}

export default AdditionalTools;
