import type { Metadata } from 'next';
import { CspAnalyzer } from '@/Components/Functions/CspAnalyzerTools';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/csp-analyzer', {
  title: 'CSP Analyzer — Content Security Policy Checker | DevOven',
  description: 'Analyze Content-Security-Policy headers in your browser. Find unsafe-inline, unsafe-eval, weak nonces, syntax errors, missing directives, and known XSS bypasses with Google’s CSP Evaluator.',
});

export default function Page() { return <CspAnalyzer />; }
