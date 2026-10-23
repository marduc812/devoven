import { inspectSourceMap } from './logic';

type Request = { text: string } | { file: File };

self.addEventListener('message', async (event: MessageEvent<Request>) => {
  try {
    const text = 'file' in event.data ? await event.data.file.text() : event.data.text;
    self.postMessage({ inspection: inspectSourceMap(text), error: '' });
  } catch (error) {
    self.postMessage({ inspection: null, error: error instanceof Error ? error.message : 'Could not inspect the source map.' });
  }
});
