import {
  FileTooLargeError,
  NotTextFileError,
  collectDrop,
  looksBinary,
  readDropped,
  MAX_FILE_BYTES,
} from '@/Components/Functions/TextEditorTools/fileIO';

// Enough of a DataTransfer for collectDrop: an item list whose entries answer the
// three questions it asks, plus the flat `files` list older browsers give instead.
type FakeItem = {
  kind: string;
  file: File | null;
  directory?: boolean;
  handle?: unknown;
  handleFails?: boolean;
};

function transfer(items: FakeItem[]): DataTransfer {
  return {
    items: items.map((item) => ({
      kind: item.kind,
      getAsFile: () => item.file,
      webkitGetAsEntry: () => ({ isDirectory: item.directory === true }),
      getAsFileSystemHandle: item.handleFails
        ? () => Promise.reject(new Error('nope'))
        : item.handle === undefined
          ? undefined
          : () => Promise.resolve(item.handle),
    })),
    files: items.flatMap((item) => (item.file ? [item.file] : [])),
  } as unknown as DataTransfer;
}

const text = (name: string, body = 'hello') => new File([body], name, { type: 'text/plain' });

describe('looksBinary', () => {
  it('accepts ordinary text', () => {
    expect(looksBinary('hello\nworld\n')).toBe(false);
  });

  it('accepts an empty file', () => {
    expect(looksBinary('')).toBe(false);
  });

  it('accepts text carrying accents, emoji and tabs', () => {
    expect(looksBinary('caffè\tκόσμε 🎉\r\n')).toBe(false);
  });

  it('rejects anything holding a NUL', () => {
    expect(looksBinary('PK\u0000\u0000binary')).toBe(true);
  });

  it('rejects a decode that fell apart into replacement characters', () => {
    expect(looksBinary('\ufffd'.repeat(40) + 'PNG')).toBe(true);
  });

  it('tolerates a stray replacement character in real text', () => {
    expect(looksBinary(`a stray \ufffd in ${'prose '.repeat(200)}`)).toBe(false);
  });

  it('only judges the head of the file, so a NUL past the sample is missed', () => {
    expect(looksBinary('a'.repeat(5000) + '\u0000')).toBe(false);
  });
});

describe('collectDrop', () => {
  it('returns the dropped files', async () => {
    const dropped = await collectDrop(transfer([{ kind: 'file', file: text('notes.txt') }]));
    expect(dropped.map((entry) => entry.file.name)).toEqual(['notes.txt']);
  });

  it('keeps a write-back handle when the browser offers one', async () => {
    const handle = { kind: 'file', name: 'notes.txt' };
    const dropped = await collectDrop(transfer([{ kind: 'file', file: text('notes.txt'), handle }]));
    expect(dropped[0].handle).toBe(handle);
  });

  it('opens the file anyway when the handle is unavailable', async () => {
    const dropped = await collectDrop(
      transfer([{ kind: 'file', file: text('notes.txt'), handleFails: true }])
    );
    expect(dropped).toHaveLength(1);
    expect(dropped[0].handle).toBeNull();
  });

  it('leaves the handle null where the browser has no such API', async () => {
    const dropped = await collectDrop(transfer([{ kind: 'file', file: text('notes.txt') }]));
    expect(dropped[0].handle).toBeNull();
  });

  it('skips directories', async () => {
    const dropped = await collectDrop(
      transfer([
        { kind: 'file', file: text('a.txt') },
        { kind: 'file', file: null, directory: true },
      ])
    );
    expect(dropped.map((entry) => entry.file.name)).toEqual(['a.txt']);
  });

  it('skips a directory handle even when the entry claimed to be a file', async () => {
    const dropped = await collectDrop(
      transfer([{ kind: 'file', file: text('a.txt'), handle: { kind: 'directory' } }])
    );
    expect(dropped[0].handle).toBeNull();
  });

  it('ignores dragged text', async () => {
    expect(await collectDrop(transfer([{ kind: 'string', file: null }]))).toEqual([]);
  });

  it('falls back to the file list when there are no items', async () => {
    const file = text('legacy.txt');
    const dropped = await collectDrop({ items: [], files: [file] } as unknown as DataTransfer);
    expect(dropped).toEqual([{ file, handle: null }]);
  });

  it('keeps every file of a multi-file drop, in order', async () => {
    const dropped = await collectDrop(
      transfer([
        { kind: 'file', file: text('a.txt') },
        { kind: 'file', file: text('b.txt') },
        { kind: 'file', file: text('c.txt') },
      ])
    );
    expect(dropped.map((entry) => entry.file.name)).toEqual(['a.txt', 'b.txt', 'c.txt']);
  });
});

describe('readDropped', () => {
  it('reads the text and carries the name and handle through', async () => {
    const handle = { kind: 'file' } as never;
    await expect(readDropped({ file: text('notes.md', 'body'), handle })).resolves.toEqual({
      name: 'notes.md',
      text: 'body',
      handle,
    });
  });

  it('names the file it refused when it is not text', async () => {
    await expect(readDropped({ file: text('logo.png', 'PNG\u0000\u0000'), handle: null })).rejects.toThrow(
      NotTextFileError
    );
    await expect(readDropped({ file: text('logo.png', 'PNG\u0000\u0000'), handle: null })).rejects.toThrow(
      /logo\.png/
    );
  });

  it('refuses a file past the size limit without reading it', async () => {
    const huge = text('huge.log');
    Object.defineProperty(huge, 'size', { value: MAX_FILE_BYTES + 1 });
    const read = jest.spyOn(huge, 'text');

    await expect(readDropped({ file: huge, handle: null })).rejects.toThrow(FileTooLargeError);
    expect(read).not.toHaveBeenCalled();
  });
});
