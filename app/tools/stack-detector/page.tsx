import type { Metadata } from 'next';
import { StackDetector } from '@/Components/Functions/StackDetectorTools';

export const metadata: Metadata = {
  title: 'Tech Stack Detector | DevOven',
  description: 'Detect frameworks and libraries from package.json, requirements.txt, go.mod, or Cargo.toml. Categorized by frontend, backend, database, testing, build tools, and deployment.',
};

export default function Page() {
  return <StackDetector />;
}
