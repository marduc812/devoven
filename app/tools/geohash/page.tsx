import type { Metadata } from 'next';
import { GeohashTool } from '@/Components/Functions/GeohashTools';

export const metadata: Metadata = {
  title: 'Geohash Encoder / Decoder | DevOven',
  description: 'Encode latitude/longitude coordinates to a geohash string or decode a geohash back to coordinates with bounding box and precision info.',
};

export default function Page() {
  return <GeohashTool />;
}
