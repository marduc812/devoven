import { IamPolicyAnalyzer } from '@/Components/Functions/IamPolicyTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IAM Policy Analyzer — DevOven',
  description:
    'Analyze AWS IAM policy JSON for wildcard actions, overly permissive patterns, and security warnings. Groups allowed and denied actions by AWS service. Also generates minimal IAM policies from plain-English descriptions.',
};

const page = () => <IamPolicyAnalyzer />;
export default page;
