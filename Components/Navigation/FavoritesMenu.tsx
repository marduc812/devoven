'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IoArrowForward } from 'react-icons/io5'
import HeartIcon from '@/Components/UI/HeartIcon'
import { useFavorites } from '@/lib/favorites'
import { getFavoriteTools } from '@/lib/favoriteTools'
import { readUsage, type ToolUsage } from '@/lib/recentTools'

export default function FavoritesMenu() {
  const favorites = useFavorites()
  const [open, setOpen] = useState(false)
  const [usage, setUsage] = useState<ToolUsage[]>([])
  const quickTools = getFavoriteTools(favorites, usage).slice(0, 5)

  const show = () => {
    setUsage(readUsage())
    setOpen(true)
  }

  return (
    <div
      className="relative flex border-l border-gray-900 dark:border-white/15"
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={show}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <Link
        href="/favorites"
        prefetch={false}
        aria-label="Favorites"
        aria-expanded={open}
        aria-controls="favorites-quick-access"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 px-3 sm:px-4 text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm font-medium uppercase tracking-wide"
      >
        <HeartIcon className="w-[18px] h-[18px]" />
        <span className="hidden lg:inline">Favorites</span>
      </Link>
      {open && (
        <div id="favorites-quick-access" className="absolute top-full right-0 w-[min(22rem,calc(100vw-1rem))] bg-white border border-gray-900 dark:border-white/15 shadow-xl normal-case tracking-normal">
          {quickTools.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {quickTools.map((tool, index) => (
                <Link key={tool.link} href={tool.link} prefetch={false} onClick={() => setOpen(false)} className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="w-5 text-[10px] font-mono text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{tool.name}</span>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-500">{tool.category}{tool.count > 0 ? ` · ${tool.count} ${tool.count === 1 ? 'use' : 'uses'}` : ''}</span>
                  </span>
                  <IoArrowForward className="text-gray-400 group-hover:text-gray-900" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-5 py-6 text-sm text-gray-500">Save a tool to see it here.</p>
          )}
          <Link href="/favorites" prefetch={false} onClick={() => setOpen(false)} className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-900 hover:bg-gray-50 transition-colors">
            View all favorites <IoArrowForward aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
