'use client'

import React, { useEffect, useState } from 'react'
import { event } from "@/Components/Functions/gtag";
import { useRouter } from 'next/navigation'
import { getSuggestions } from '@/Components/Functions/Utils'

const AdditionalTools = () => {
    const [results, setResults] = useState<AdditionalToolType[] | null>(null);

    // Suggestions are derived from the static menu, so they're computed locally
    // rather than fetched. This stays in an effect because getSuggestions()
    // shuffles randomly — running it during render would break hydration.
    useEffect(() => {
        setResults(getSuggestions(window.location.pathname));
    }, [])

    return (
        <div className='py-8'>
            {results && (
                <>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Related Tools</h2>
                    <div className="flex flex-row flex-wrap gap-2">
                        {results.map((tool, index) => (
                            <AdditionalToolView key={index} name={tool.name} link={tool.link} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

type AdditionalToolType = {
    name: string;
    link: string;
}

const AdditionalToolView = (props: AdditionalToolType) => {

    const router = useRouter();

    const navigateTo = () => {
        if (window.location.hostname !== 'localhost') {
            event({
                action: "additional_tools",
                category: "User Interaction",
                label: window.location.pathname,
                value: 1,
            });
        }
        router.push(props.link, { scroll: false })
    }

    return (
        <div onClick={navigateTo} className='hover:cursor-pointer'>
            <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center transition-colors duration-150">
                <p className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">{props.name}</p>
            </div>
        </div>
    )
}

export default AdditionalTools;
