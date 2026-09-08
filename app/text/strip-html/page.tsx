import type { Metadata } from 'next';
import { StripHtmlTags } from '@/Components/Functions/TextCleanupTools';

export const metadata: Metadata = {
  title: 'Strip HTML Tags | DevOven',
  description: 'Pull the plain text out of an HTML fragment: tags, comments, script and style bodies removed, entities decoded, block elements turned into line breaks.',
};

const page = () => {
  return <StripHtmlTags />;
};

export default page;
