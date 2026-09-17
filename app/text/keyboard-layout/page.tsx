import { KeyboardLayoutAnalyzer } from '@/Components/Functions/KeyboardLayoutTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/keyboard-layout', {
  title: 'Keyboard Layout Analyzer | DevOven',
  description: 'Analyze text for keyboard layout efficiency. Compare QWERTY, Dvorak, and Colemak layouts with home row usage, same-finger bigrams, and hand alternation metrics.',
});

const page = () => <KeyboardLayoutAnalyzer />;
export default page;
