import { ContentTypeBuilder } from '@/Components/Functions/ContentTypeBuilderTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Content-Type Builder - DevOven',
  description: 'Build Content-Type headers from file extensions, parse existing headers, or browse 100+ MIME type mappings. Handles charset, boundary for multipart, and media type lookup.',
};

const page = () => <ContentTypeBuilder />;
export default page;
