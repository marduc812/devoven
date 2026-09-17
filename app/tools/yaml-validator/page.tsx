import { YamlValidator } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/yaml-validator', {
  title: 'YAML Validator — DevOven',
  description: 'Validate YAML online and view its canonical form. Instant error detection with exact line and position information.',
});

const page = () => (
  <>
    <YamlValidator />
  </>
);

export default page;
