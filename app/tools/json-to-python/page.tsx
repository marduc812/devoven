import { JsonToPython } from '@/Components/Functions/CodeGenTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON to Python Dict — DevOven',
  description: 'Convert JSON to Python dictionary or dataclass syntax. Automatically maps JSON types to Python types including int, float, str, bool, List, and Optional.',
};

const page = () => (
  <>
    <JsonToPython />
  </>
);

export default page;
