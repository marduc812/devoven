'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { toggleFavorite, useFavorites } from '@/lib/favorites'
import HeartIcon from '@/Components/UI/HeartIcon'

export default function FavoriteButton() {
  const pathname = usePathname()
  const favorites = useFavorites()
  const active = favorites.includes(pathname)
  const [animation, setAnimation] = useState(0)

  return (
    <button
      type="button"
      onClick={() => {
        toggleFavorite(pathname)
        setAnimation((value) => value + 1)
      }}
      aria-pressed={active}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      className="flex-shrink-0 border border-gray-300 flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
    >
      <span key={animation} className={animation > 0 && active ? 'favorite-heart-pop' : ''}>
        <HeartIcon filled={active} className={active ? 'text-red-500' : ''} />
      </span>
      <span className="uppercase tracking-wide text-xs font-semibold">{active ? 'Favorited' : 'Favorite'}</span>
    </button>
  )
}
