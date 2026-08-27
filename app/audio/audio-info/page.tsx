import type { Metadata } from 'next';
import { AudioInfo } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Audio File Info | DevOven",
  description: "Read duration, sample rate, channels, bitrate, and peak/RMS levels from an audio file.",
};

export default function Page() {
  return <AudioInfo />;
}
