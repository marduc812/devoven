import type { Metadata } from 'next';
import { CrxDownloader } from '@/Components/Functions/CrxDownloaderTools';

export const metadata: Metadata = {
  title: 'Chrome Extension CRX Downloader | DevOven',
  description: 'Generate a direct download link for any Chrome Web Store extension. Fetch the .crx file from Firefox, curl, or any browser and side-load it into a Chrome with no internet access.',
};

export default function Page() {
  return <CrxDownloader />;
}
