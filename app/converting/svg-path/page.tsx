import { SvgPathAnalyzer } from '@/Components/Functions/SvgPathTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SVG Path Analyzer - DevOven',
  description: 'Parse and explain SVG path d attribute commands. Get human-readable descriptions for M, L, H, V, C, S, Q, T, A, Z commands with bounding box and path length estimates.',
};

const page = () => <SvgPathAnalyzer />;
export default page;
