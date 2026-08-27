import type { Metadata } from 'next';
import { AudioFade } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Audio Fade In & Out | DevOven",
  description: "Apply a linear fade in and fade out to an audio clip in your browser.",
};

export default function Page() {
  return <AudioFade />;
}
