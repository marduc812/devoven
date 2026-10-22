import type { Metadata } from 'next'
import FavoritesView from '@/Components/MainView/Home/FavoritesView'

export const metadata: Metadata = {
  title: 'Favorites | DevOven',
  description: 'Your favorite DevOven tools, saved in this browser.',
}

export default function FavoritesPage() {
  return <FavoritesView />
}
