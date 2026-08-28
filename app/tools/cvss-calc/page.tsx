import type { Metadata } from 'next';
import { CvssCalculator } from '@/Components/Functions/CvssCalcTools';

export const metadata: Metadata = {
  title: 'CVSS v3.1 Base Score Calculator | DevOven',
  description: 'Calculate CVSS v3.1 base scores using the FIRST specification formula. Select base metrics (Attack Vector, Complexity, Privileges, Scope, CIA Impact) to generate a score, severity rating, and vector string.',
};

export default function Page() {
  return <CvssCalculator />;
}
