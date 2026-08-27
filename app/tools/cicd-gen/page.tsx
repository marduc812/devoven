import type { Metadata } from 'next';
import { CicdPipelineGenerator } from '@/Components/Functions/CicdGenTools';

export const metadata: Metadata = {
  title: 'CI/CD Pipeline Generator | DevOven',
  description: 'Generate CI/CD pipeline YAML for GitHub Actions, GitLab CI, and CircleCI. Supports Node.js, Python, Go, Rust, and Docker projects with caching, test, build, and deploy steps.',
};

export default function Page() {
  return <CicdPipelineGenerator />;
}
