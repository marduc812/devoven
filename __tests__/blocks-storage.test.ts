import { exportPipelineJson, importPipelineJson } from '@/lib/blocks/storage';
import { PipelineState } from '@/lib/blocks/types';

const state: PipelineState = {
  input: 'a\nb',
  blocks: [
    { id: 'x1', operationId: 'each-line', params: { by: 'line', custom: '' }, enabled: true },
    { id: 'x2', operationId: 'keep-if', params: { how: 'gt', value: '10' }, enabled: true },
    { id: 'x3', operationId: 'compare', params: { how: 'eq', a: '', b: '{n}' }, enabled: true, linked: 'a' },
  ],
};

describe('pipeline JSON', () => {
  it('round-trips through the export shape', () => {
    const text = exportPipelineJson(state, 'filter');
    expect(JSON.parse(text)).toEqual({ v: 1, name: 'filter', pipeline: state });
    expect(importPipelineJson(text)).toEqual(state);
  });

  it('accepts a bare pipeline too', () => {
    expect(importPipelineJson(JSON.stringify(state))).toEqual(state);
  });

  it('rejects anything that is not a pipeline', () => {
    expect(importPipelineJson('not json')).toBeNull();
    expect(importPipelineJson('{"pipeline": {"input": 1, "blocks": []}}')).toBeNull();
    expect(importPipelineJson('{"input": "", "blocks": [{"id": "a", "operationId": "nope", "params": {}, "enabled": true}]}')).toBeNull();
  });

  it('cleans params it does not know, like a share link does', () => {
    const loaded = importPipelineJson(JSON.stringify({
      input: '',
      blocks: [{ id: 'a', operationId: 'keep-if', params: { how: 'bogus', value: '1', extra: 'x' }, enabled: true }],
    }));
    expect(loaded?.blocks[0].params).toEqual({ how: 'eq', value: '1' });
  });
});
