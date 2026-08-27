import type { Metadata } from 'next';
import { MakefileGen } from '@/Components/Functions/MakefileGenTools';

export const metadata: Metadata = {
  title: 'Makefile Generator | DevOven',
  description: 'Generate Makefiles with .PHONY declarations, help target, and common patterns for Node.js, Python, Go, Rust, Docker, and generic projects.',
};

export default function Page() {
  return <MakefileGen />;
}
