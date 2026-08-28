// File open/save for the editor. Uses the File System Access API where it exists
// (Chrome, Edge, Opera) so "Save" can write back to the file the user opened, and
// falls back to an <input type="file"> plus a download everywhere else.
//
// Nothing here uploads anything — files are read into memory in the browser.

export type FileHandle = {
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
};

type PickerWindow = Window & {
  showOpenFilePicker?: (options?: unknown) => Promise<FileHandle[]>;
  showSaveFilePicker?: (options?: unknown) => Promise<FileHandle>;
};

export type OpenedFile = { name: string; text: string; handle: FileHandle | null };

// Above this the editor still works but starts to feel sluggish, so we warn.
export const LARGE_FILE_BYTES = 5 * 1024 * 1024;
// Above this a textarea-based editor is not a good experience at all.
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export class FileTooLargeError extends Error {
  constructor(name: string) {
    super(`${name} is too large to open here (limit 25 MB).`);
    this.name = 'FileTooLargeError';
  }
}

export class NotTextFileError extends Error {
  constructor(name: string) {
    super(`${name} does not look like a text file.`);
    this.name = 'NotTextFileError';
  }
}

export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && typeof (window as PickerWindow).showOpenFilePicker === 'function';
}

// The pickers reject with AbortError when the user dismisses the dialog, which is
// a normal outcome rather than a failure.
function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

// How much of a decoded file is judged before deciding it is not text. Enough to
// clear any header a real text file might start with, small enough to be free.
const BINARY_SAMPLE = 4096;

/**
 * A text editor can do nothing useful with a JPEG, and dropping one in fills the
 * buffer with megabytes of replacement characters. The decoded text is judged
 * rather than the raw bytes: a NUL never appears in text, and a scattering of
 * U+FFFD means the decoder was handed something that was never UTF-8 to begin
 * with. A stray replacement character in otherwise fine text is left alone.
 */
export function looksBinary(text: string): boolean {
  const length = Math.min(text.length, BINARY_SAMPLE);
  let replacements = 0;

  for (let i = 0; i < length; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x0000) return true;
    if (code === 0xfffd) replacements++;
  }

  return replacements > Math.max(2, length * 0.005);
}

async function readFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new FileTooLargeError(file.name);

  const text = await file.text();
  if (looksBinary(text)) throw new NotTextFileError(file.name);
  return text;
}

const TEXT_FILE_TYPES = [
  {
    description: 'Text files',
    accept: { 'text/plain': ['.txt', '.md', '.csv', '.log', '.json', '.xml', '.yml', '.yaml'] },
  },
];

export async function openFile(): Promise<OpenedFile | null> {
  const picker = (window as PickerWindow).showOpenFilePicker;

  if (picker) {
    try {
      const [handle] = await picker({ types: TEXT_FILE_TYPES, excludeAcceptAllOption: false, multiple: false });
      if (!handle) return null;
      const file = await handle.getFile();
      return { name: handle.name, text: await readFile(file), handle };
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
  }

  return openFileViaInput();
}

function openFileViaInput(): Promise<OpenedFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.csv,.log,.json,.xml,.yml,.yaml,text/*';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve({ name: file.name, text: await readFile(file), handle: null });
      } catch (error) {
        reject(error);
      }
    };

    // Cancelling the native file dialog fires no event in older browsers, so the
    // promise simply never settles — acceptable, nothing is left in a bad state.
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/* ---------- drag and drop ---------- */

export type DroppedFile = { file: File; handle: FileHandle | null };

type HandleItem = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<({ kind?: string } & FileHandle) | null>;
};

/**
 * The files behind a drop, with a write-back handle each where the browser offers
 * one — dropping a file into Chromium leaves "Save" able to write straight back
 * to it, exactly as if it had been opened through the picker.
 *
 * Must be called synchronously from the drop handler: a DataTransfer is emptied
 * as soon as the event finishes, so every item is claimed before the first await.
 * Directories are dropped on the floor; there is nothing to open in one.
 */
export function collectDrop(transfer: DataTransfer): Promise<DroppedFile[]> {
  const items: DataTransferItem[] = [];
  for (let i = 0; i < (transfer.items?.length ?? 0); i++) items.push(transfer.items[i]);

  // Safari and Firefox expose the handle API not at all, and older browsers
  // expose no item list either — `files` still has everything but the handles.
  if (items.length === 0) {
    return Promise.resolve(Array.from(transfer.files ?? []).map((file) => ({ file, handle: null })));
  }

  const claimed = items
    .filter((item) => item.kind === 'file' && item.webkitGetAsEntry?.()?.isDirectory !== true)
    .map((item) => ({
      file: item.getAsFile(),
      // Rejects on a cross-origin or otherwise unreachable entry; the file itself
      // is still readable, it just cannot be saved back to.
      handle: (item as HandleItem).getAsFileSystemHandle?.().catch(() => null) ?? Promise.resolve(null),
    }));

  return Promise.all(
    claimed.map(async ({ file, handle }) => {
      const resolved = await handle;
      return { file, handle: resolved && resolved.kind !== 'directory' ? resolved : null };
    })
  ).then((entries) =>
    entries.filter((entry): entry is DroppedFile => entry.file !== null)
  );
}

export async function readDropped({ file, handle }: DroppedFile): Promise<OpenedFile> {
  return { name: file.name, text: await readFile(file), handle };
}

export async function saveToHandle(handle: FileHandle, text: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

export async function saveFileAs(
  text: string,
  suggestedName: string
): Promise<{ name: string; handle: FileHandle | null } | null> {
  const picker = (window as PickerWindow).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker({ suggestedName, types: TEXT_FILE_TYPES });
      await saveToHandle(handle, text);
      return { name: handle.name, handle };
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
  }

  downloadText(text, suggestedName);
  return { name: suggestedName, handle: null };
}

function downloadText(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
