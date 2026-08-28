import type { Metadata } from 'next';
import { AudioJoiner } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Audio Joiner | DevOven",
  description: "Concatenate multiple audio files into one track in your browser. Handles mismatched sample rates.",
};

export default function Page() {
  return <AudioJoiner />;
}
