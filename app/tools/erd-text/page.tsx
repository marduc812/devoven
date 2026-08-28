import type { Metadata } from 'next';
import { ErdTextGenerator } from '@/Components/Functions/ErdTextTools';

export const metadata: Metadata = {
  title: 'ERD Text Generator | DevOven',
  description: 'Describe tables with a simple syntax like users(id, name, email) to generate ASCII ER diagrams and Mermaid erDiagram code. Foreign keys auto-detected from _id suffix.',
};

export default function Page() {
  return <ErdTextGenerator />;
}
