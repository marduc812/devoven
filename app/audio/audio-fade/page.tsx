import type { Metadata } from 'next';
import { AudioFade } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/audio-fade', {
  title: "Audio Fade In & Out | DevOven",
  description: "Apply a linear fade in and fade out to an audio clip in your browser.",
});

export default function Page() {
  return <AudioFade />;
}
