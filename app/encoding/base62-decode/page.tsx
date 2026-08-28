import { Base62Decoder } from '@/Components/Functions/Base62Tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base62 Decoder | DevOven',
  description: 'Free online Base62 decoder (0-9, A-Z, a-z). Decode Base62 encoded text or integers back to their original values. Runs entirely in your browser.',
};

const page = () => <Base62Decoder />;
export default page;
