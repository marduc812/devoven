import { PhpSerializer } from '@/Components/Functions/PhpSerializeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/php-serialize', {
  title: 'PHP Serialize & Unserialize Online',
  description:
    'Convert PHP serialize() output to JSON and back, in your browser. Handles arrays, objects, enums, references and private or protected properties, with byte-accurate string lengths.',
});

const page = () => <PhpSerializer />;
export default page;
