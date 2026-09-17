import { Base62Decoder } from '@/Components/Functions/Base62Tools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base62-decode', {
  title: 'Base62 Decoder | DevOven',
  description: 'Free online Base62 decoder (0-9, A-Z, a-z). Decode Base62 encoded text or integers back to their original values. Runs entirely in your browser.',
});

const page = () => <Base62Decoder />;
export default page;
