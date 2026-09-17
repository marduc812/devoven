import type { Metadata } from 'next';
import { WaveformViewer } from '@/Components/Functions/AudioTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/audio/waveform-viewer', {
  title: "Audio Waveform Viewer | DevOven",
  description: "Render an audio waveform as a downloadable PNG in your browser.",
});

export default function Page() {
  return <WaveformViewer />;
}
