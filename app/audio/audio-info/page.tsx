import type { Metadata } from 'next';
import { AudioInfo } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/audio-info', {
  title: "Audio File Info | DevOven",
  description: "Read duration, sample rate, channels, bitrate, and peak/RMS levels from an audio file.",
});

export default function Page() {
  return <AudioInfo />;
}
