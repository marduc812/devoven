import { JsFormatter } from '@/Components/Functions/CodeFormatters';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JavaScript Formatter & Minifier — DevOven',
  description: 'Format or minify JavaScript online using Prettier. Pretty-print your code or strip comments and whitespace for production.',
};

const page = () => (
  <>
    <JsFormatter />
  </>
);

export default page;
