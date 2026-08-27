import type { RegexFlags, RegexTestResult } from '@/Components/Functions/RegexTesterTools/logic';

export type RegexReplaceJob = {
  kind: 'replace';
  text: string;
  pattern: string;
  flags: string;
  replacement: string;
};

export type RegexTestJob = {
  kind: 'test';
  pattern: string;
  text: string;
  flags: RegexFlags;
};

export type RegexJob = RegexReplaceJob | RegexTestJob;
export type RegexJobResult = string | RegexTestResult;
