'use client'

import React from 'react'
import { IoLinkOutline } from 'react-icons/io5'
import { toast } from 'react-hot-toast'
import { event } from '@/Components/Functions/gtag'
import { useShareLinkQuery } from '@/Components/Functions/ShareLink'

/**
 * The one link button on a tool page. It copies the tool's whole state - input
 * and every option - not the single field it happens to sit next to. Tools feed
 * it through `useShareLink`; see Components/Functions/ShareLink.tsx.
 */
const ShareLinkButton = () => {
    const query = useShareLinkQuery()

    const copy = () => {
        if (window.location.hostname !== 'localhost') {
            event({
                action: 'Copy_url_with_values',
                category: 'User Interaction',
                label: window.location.pathname,
                value: 1,
            })
        }
        const url = document.location.origin
            .concat(document.location.pathname, query ? `?${query}` : '')
        navigator.clipboard.writeText(url)
        toast.success(query ? 'Copied link with your settings' : 'Copied link to clipboard')
    }

    return (
        <button
            type="button"
            onClick={copy}
            aria-label="Copy a link to this tool with its current values"
            title="Copy a link to this tool with its current values"
            className="flex-shrink-0 border border-gray-300 flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
        >
            <IoLinkOutline className="text-base" />
            <span className="uppercase tracking-wide text-xs font-semibold">Copy link</span>
        </button>
    )
}

export default ShareLinkButton
