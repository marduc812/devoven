'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IoArrowForward, IoClose } from 'react-icons/io5'
import HeartIcon from '@/Components/UI/HeartIcon'
import { toggleFavorite, useFavorites } from '@/lib/favorites'
import { getFavoriteTools } from '@/lib/favoriteTools'
import { readUsage, type ToolUsage } from '@/lib/recentTools'

export default function FavoritesView() {
  const favoriteLinks = useFavorites()
  const [usage, setUsage] = useState<ToolUsage[]>([])
  const favorites = getFavoriteTools(favoriteLinks, usage)

  useEffect(() => {
    const refresh = () => setUsage(readUsage())
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  return (
    <main className="min-h-[calc(100vh-7rem)] bg-white">
      <div className="border-b border-gray-900">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-9 md:py-12 flex items-center gap-5">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center bg-red-500 text-white">
            <HeartIcon filled className="w-7 h-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1">Your collection</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Favorites</h1>
            <p className="text-sm text-gray-500 mt-1">The tools you want to keep close, saved in this browser.</p>
          </div>
          <span className="hidden sm:flex items-center justify-center min-w-12 h-12 px-3 border border-gray-300 text-xl font-black text-gray-900" aria-label={`${favorites.length} saved tools`}>
            {favorites.length}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem] gap-6 items-start">
        <section className="border border-gray-200 bg-white" aria-labelledby="saved-tools-heading">
          <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4 border-b border-gray-200">
            <h2 id="saved-tools-heading" className="text-xs font-bold uppercase tracking-widest text-gray-900">Saved tools</h2>
            <span className="text-xs text-gray-500">{favorites.length > 0 ? 'Most used first' : 'Nothing saved yet'}</span>
          </div>
          {favorites.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {favorites.map((tool, index) => (
                <div key={tool.link} className="group flex items-center gap-3 md:gap-4 px-4 md:px-6 hover:bg-gray-50 transition-colors">
                  <span className="w-6 flex-shrink-0 font-mono text-xs text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                  <Link href={tool.link} prefetch={false} className="flex min-w-0 flex-1 items-center gap-3 py-5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-gray-900">{tool.name}</span>
                      <span className="block mt-0.5 text-[11px] uppercase tracking-wider text-gray-500">{tool.category === tool.type ? tool.category : `${tool.category} / ${tool.type}`}</span>
                    </span>
                    <span className="hidden sm:block text-xs text-gray-500 flex-shrink-0">{tool.count > 0 ? `${tool.count} ${tool.count === 1 ? 'use' : 'uses'}` : 'New'}</span>
                    <IoArrowForward className="text-gray-400 group-hover:text-gray-900 flex-shrink-0" aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={() => toggleFavorite(tool.link)} aria-label={`Remove ${tool.name} from favorites`} title="Remove favorite" className="p-2 text-gray-400 hover:text-red-500 focus-visible:text-red-500 transition-colors">
                    <IoClose aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <HeartIcon className="w-9 h-9 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No favorites yet</h3>
              <p className="text-sm text-gray-500 mt-2 mb-5">Open any tool and click Favorite to save it here.</p>
              <Link href="/#tools-collection" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-500 transition-colors">
                Browse tools <IoArrowForward aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        <aside className="border border-gray-200 bg-gray-50 p-6">
          <span className="flex w-9 h-9 items-center justify-center border border-gray-300 text-red-500 mb-5"><HeartIcon className="w-[18px] h-[18px]" /></span>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">Keep your tools handy</h2>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">Hover over Favorites in the top bar to open your five most used saved tools.</p>
          <Link href="/#tools-collection" className="inline-flex items-center gap-2 mt-6 text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-red-500 transition-colors">
            Browse all tools <IoArrowForward aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </main>
  )
}
