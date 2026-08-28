import type { Metadata } from 'next';
import OpenSourceMainView from '@/Components/OpenSource/MainView';

export const metadata: Metadata = {
  title: 'Open Source | DevOven',
  description:
    'DevOven is free software under the AGPL-3.0-or-later. Get the source, and see every open source library the site is built on.',
};

export default function Page() {
  return <OpenSourceMainView />;
}
