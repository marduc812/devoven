'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { menu } from '@/menu'
import { trackToolUsage } from '@/lib/recentTools'

/**
 * Counts a visit whenever the path matches a tool in the menu. Mounted once in
 * the root layout so no tool page has to opt in.
 */
const toolsByLink = new Map(
    menu.flatMap((group) =>
        group.links.map((link) => [link.link, { name: link.name, category: group.name }])
    )
)

const ToolUsageTracker = () => {
    const pathname = usePathname()

    useEffect(() => {
        if (!pathname) return
        const tool = toolsByLink.get(pathname)
        if (!tool) return
        trackToolUsage({ link: pathname, name: tool.name, category: tool.category })
    }, [pathname])

    return null
}

export default ToolUsageTracker
