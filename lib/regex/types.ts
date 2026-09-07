import type { RegexFlags, RegexTestResult } from '@/Components/Functions/RegexTesterTools/logic';
import type { FileMatches, SearchFile } from '@/Components/Functions/TextEditorTools/crossFileSearch';
import type { FindOptions } from '@/Components/Functions/TextEditorTools/logic';

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

/** The text editor's find bar: one query over one or more open buffers. */
export type RegexFindJob = {
  kind: 'find';
  files: SearchFile[];
  query: string;
  options: FindOptions;
};

export type RegexJob = RegexReplaceJob | RegexTestJob | RegexFindJob;
export type RegexJobResult = string | RegexTestResult | FileMatches[];
