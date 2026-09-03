import type { Metadata } from 'next';
import PrivacyMainView from '@/Components/Privacy/MainView';

export const metadata: Metadata = {
  title: 'Privacy | DevOven',
  description:
    'What DevOven collects and what it does not. Every tool runs in your browser: nothing you paste is uploaded. Page counts are cookieless, and Google Analytics loads only if you accept.',
};

export default function Page() {
  return <PrivacyMainView />;
}
