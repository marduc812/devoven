import { runPipeline } from './pipeline';
import { serveWorker } from '../workers/protocol';
import type { PipelineState, BlockResult } from './types';

// Operations run here rather than on the main thread because some of them can
// take unbounded time on input nobody typed: a `?p=` link chooses the regex,
// its flags and the string it runs against, and a pattern like `(a+)+$` on a
// few dozen characters backtracks for minutes. A worker can be killed. The
// render pass this used to run in could not.
serveWorker<PipelineState, BlockResult[]>(runPipeline);
