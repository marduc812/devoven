import type { Metadata } from 'next';
import { LicenseChooser } from '@/Components/Functions/LicenseChooserTools';

export const metadata: Metadata = {
  title: 'License Chooser | DevOven',
  description: 'Compare open-source licenses (MIT, Apache 2.0, GPL, BSD, ISC, MPL, AGPL, Unlicense, CC0) and get a smart suggestion based on your project needs.',
};

export default function Page() {
  return <LicenseChooser />;
}
