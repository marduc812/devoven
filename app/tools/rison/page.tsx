import { RisonConverter } from '@/Components/Functions/RisonTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rison Decoder & Encoder (Kibana URLs)',
  description:
    'Decode the Rison in a Kibana _a or _g URL parameter to JSON, and encode JSON back to Rison. Supports the bracket-less o-rison and a-rison forms. Runs in your browser.',
};

const page = () => <RisonConverter />;
export default page;
