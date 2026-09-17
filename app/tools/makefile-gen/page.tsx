import type { Metadata } from 'next';
import { MakefileGen } from '@/Components/Functions/MakefileGenTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/makefile-gen', {
  title: 'Makefile Generator | DevOven',
  description: 'Generate Makefiles with .PHONY declarations, help target, and common patterns for Node.js, Python, Go, Rust, Docker, and generic projects.',
});

export default function Page() {
  return <MakefileGen />;
}
