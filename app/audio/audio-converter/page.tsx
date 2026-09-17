import type { Metadata } from 'next';
import { AudioConverter } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/audio-converter', {
  title: "Audio Converter | DevOven",
  description: "Convert MP3, OGG, FLAC, M4A, or Opus audio to WAV in your browser. Resample or fold to mono. Nothing is uploaded.",
});

export default function Page() {
  return <AudioConverter />;
}
