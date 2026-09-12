// Neither of the two compression libraries ships type declarations, and both are
// imported for their synchronous entry points so the operations can run inside a
// Blocks pipeline.

declare module 'bz2' {
  /**
   * `decompress` is optional because the package only assigns `module.exports`
   * when there is no `window`; in a browser bundle it publishes itself on
   * `window.bz2` instead and this import resolves to an empty object.
   */
  const bz2: { decompress?(bytes: Uint8Array): Uint8Array };
  export default bz2;
}

declare module 'lzma/src/lzma_worker.js' {
  /**
   * LZMA-JS runs synchronously when no callback is passed, which is the only
   * mode used here. `compress` returns signed bytes (-128..127) and
   * `decompress` returns a string when the result decodes as UTF-8 and signed
   * bytes when it does not.
   *
   * The file assigns onto `this` rather than naming its exports, so bundlers
   * only see the CommonJS object: it has to be reached through the default
   * import, never `import { LZMA }`.
   */
  const lzmaWorker: {
    LZMA: {
      compress(data: string | Uint8Array | number[], mode?: number): number[];
      decompress(bytes: Uint8Array | number[]): string | number[];
    };
  };
  export default lzmaWorker;
}
