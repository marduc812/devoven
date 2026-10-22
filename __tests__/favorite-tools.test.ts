import { getFavoriteTools } from '@/lib/favoriteTools'
import type { ToolUsage } from '@/lib/recentTools'

describe('favorite tool order', () => {
  it('sorts saved tools by use count and then latest visit', () => {
    const links = ['/encoding/url-encode', '/hashing/sha256', '/text/markdown-preview']
    const usage: ToolUsage[] = [
      { link: links[0], name: 'URL Encode', category: 'encode', count: 2, lastUsed: 100 },
      { link: links[1], name: 'SHA256', category: 'hash', count: 5, lastUsed: 50 },
      { link: links[2], name: 'Markdown Preview', category: 'text', count: 2, lastUsed: 200 },
    ]

    expect(getFavoriteTools(links, usage).map((tool) => tool.link)).toEqual([
      '/hashing/sha256',
      '/text/markdown-preview',
      '/encoding/url-encode',
    ])
  })

  it('keeps unvisited favorites after visited ones', () => {
    const links = ['/encoding/url-encode', '/hashing/sha256']
    const usage: ToolUsage[] = [
      { link: links[1], name: 'SHA256', category: 'hash', count: 1, lastUsed: 100 },
    ]

    expect(getFavoriteTools(links, usage).map((tool) => tool.link)).toEqual([
      '/hashing/sha256',
      '/encoding/url-encode',
    ])
  })
})
