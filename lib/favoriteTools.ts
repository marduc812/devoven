import { menu } from '@/menu'
import type { ToolUsage } from '@/lib/recentTools'

const catalog = new Map(menu.flatMap((group) =>
  group.links.map((link) => [link.link, { ...link, category: group.name }])
))

export function getFavoriteTools(links: string[], usage: ToolUsage[]) {
  const visits = new Map(usage.map((entry) => [entry.link, entry]))
  return links.flatMap((link, index) => {
    const tool = catalog.get(link)
    if (!tool) return []
    const visit = visits.get(link)
    return [{ ...tool, count: visit?.count ?? 0, lastUsed: visit?.lastUsed ?? 0, savedIndex: index }]
  }).sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed || a.savedIndex - b.savedIndex)
}
