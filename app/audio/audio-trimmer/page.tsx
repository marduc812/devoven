import type { Metadata } from 'next';
import { AudioTrimmer } from '@/Components/Functions/AudioTools';

export const metadata: Metadata = {
  title: "Audio Trimmer | DevOven",
  description: "Cut a clip out of an audio file by start and end time, entirely in your browser.",
};

export default function Page() {
  return <AudioTrimmer />;
}
