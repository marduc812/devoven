import HomeLinksListView from '@/Components/MainView/Home/ListView'
import MainView from '@/Components/MainView/Home/MainView'
import FeaturedTools from '@/Components/MainView/Home/FeaturedTools'
import RecentTools from '@/Components/MainView/Home/RecentTools'
import type { Metadata } from 'next'

// The canonical lives here rather than in the root layout, so that a 404 does
// not inherit it and tell Google the missing URL is really the home page.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Home() {
  return (
    <div>
      <MainView />
      <RecentTools />
      <FeaturedTools />
      <HomeLinksListView />
    </div>
  )
}
