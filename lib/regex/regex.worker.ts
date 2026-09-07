import { serveWorker } from '../workers/protocol';
import { regexFindReplace } from '@/Components/Functions/TextUtilities/logic';
import { testRegex } from '@/Components/Functions/RegexTesterTools/logic';
import { findAcross } from '@/Components/Functions/TextEditorTools/crossFileSearch';
import type { RegexJob, RegexJobResult } from './types';

// A pattern the user typed is not hostile, but it is unbounded: `(a+)+$` on a
// few dozen characters backtracks for minutes, and nothing can interrupt a
// running RegExp. Running it here means the tab survives the mistake.
serveWorker<RegexJob, RegexJobResult>((job) => {
  switch (job.kind) {
    case 'replace':
      return regexFindReplace(job.text, job.pattern, job.flags, job.replacement);
    case 'find':
      return findAcross(job.files, job.query, job.options);
    default:
      return testRegex(job.pattern, job.text, job.flags);
  }
});
