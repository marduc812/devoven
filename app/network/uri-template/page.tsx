import { UriTemplateExpander } from '@/Components/Functions/UriTemplateTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/network/uri-template', {
  title: 'URI Template Expander - DevOven',
  description: 'Expand RFC 6570 URI templates with variable substitution. Supports all operators: simple, reserved, fragment, label, path, path-style, query, and query continuation.',
});

const page = () => <UriTemplateExpander />;
export default page;
