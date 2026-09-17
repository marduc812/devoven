import { Base62Encoder } from '@/Components/Functions/Base62Tools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base62-encode', {
  title: 'Base62 Encoder | DevOven',
  description: 'Free online Base62 encoder (0-9, A-Z, a-z). Encode text or integers to compact Base62 representations. Used in URL shorteners and compact IDs. Runs entirely in your browser.',
});

const page = () => <Base62Encoder />;
export default page;
