import type { Metadata } from 'next';
import { AudioJoiner } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/audio-joiner', {
  title: "Audio Joiner | DevOven",
  description: "Concatenate multiple audio files into one track in your browser. Handles mismatched sample rates.",
});

export default function Page() {
  return <AudioJoiner />;
}
