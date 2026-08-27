import HomeLinksListView from '@/Components/MainView/Home/ListView'
import MainView from '@/Components/MainView/Home/MainView'
import FeaturedTools from '@/Components/MainView/Home/FeaturedTools'
import RecentTools from '@/Components/MainView/Home/RecentTools'

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
