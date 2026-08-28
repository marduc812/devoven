import type { Metadata } from 'next';
import { RedosCheckerTool } from '@/Components/Functions/RedosTools';

export const metadata: Metadata = {
  title: 'ReDoS Checker — Regex Complexity & Catastrophic Backtracking | DevOven',
  description:
    'Check a regular expression for ReDoS. Finds catastrophic backtracking, proves it with a real attack string and timing curve measured in your browser, and shows which regex engines are affected.',
};

export default function Page() {
  return <RedosCheckerTool />;
}
