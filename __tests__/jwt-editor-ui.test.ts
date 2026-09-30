/** @jest-environment jsdom */

import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { JwtEditor } from '@/Components/Functions/JwtEditorTools';
import {
  base64urlEncodeString,
  decodeJwtParts,
  verifySignature,
  signJwt,
} from '@/Components/Functions/JwtEditorTools/logic';

jest.mock('../Components/Functions/JwtEditorTools/logic', () => {
  const actual = jest.requireActual('../Components/Functions/JwtEditorTools/logic');
  return { ...actual, signJwt: jest.fn(actual.signJwt) };
});

jest.mock('../Components/MainView/MainPanel/Panel', () => ({
  __esModule: true,
  default: ({ extraElements }: { extraElements: ReactNode }) => extraElements,
}));
jest.mock('../Components/Functions/ShareLink', () => ({ useShareLink: jest.fn() }));
jest.mock('../Components/View/FileInput', () => ({
  FileDropZone: ({ children }: { children: ReactNode }) => children,
  FileTextArea: ({ children }: { children: ReactNode }) => children,
  LoadFileButton: () => null,
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(JwtEditor)); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  jest.restoreAllMocks();
});

const field = (index: number) => container.querySelectorAll('textarea')[index];

async function edit(index: number, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
    setter.call(field(index), value);
    field(index).dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('updates and re-signs header and payload edits without pressing the update button', async () => {
  await edit(1, JSON.stringify({ alg: 'HS512', typ: 'JWT', kid: 'new-key' }));
  expect(JSON.parse(decodeJwtParts(field(0).value).header)).toEqual({
    alg: 'HS512', typ: 'JWT', kid: 'new-key',
  });
  expect(container.querySelector('select')!.value).toBe('HS512');
  expect(verifySignature(field(0).value, 'your-256-bit-secret')).toBe(true);

  await edit(2, JSON.stringify({ name: 'Edited user', nested: { role: 'admin' } }));
  expect(JSON.parse(decodeJwtParts(field(0).value).payload)).toEqual({
    name: 'Edited user', nested: { role: 'admin' },
  });
  expect(verifySignature(field(0).value, 'your-256-bit-secret')).toBe(true);
});

it('updates pasted asymmetric tokens even without a private key', async () => {
  const header = { alg: 'RS256', typ: 'JWT' };
  const original = `${base64urlEncodeString(JSON.stringify(header))}.${base64urlEncodeString('{"sub":"original"}')}.original-signature`;
  await edit(0, original);
  await edit(2, '{"sub":"edited"}');
  expect(JSON.parse(decodeJwtParts(field(0).value).payload)).toEqual({ sub: 'edited' });
  expect(field(0).value.split('.')[2]).toBe('original-signature');
  expect(container.textContent).toContain('Provide a private key to re-sign');

  await edit(1, JSON.stringify({ ...header, kid: 'edited-key' }));
  expect(JSON.parse(decodeJwtParts(field(0).value).header).kid).toBe('edited-key');
});

it('keeps the last valid token while JSON is incomplete, then updates when corrected', async () => {
  const original = field(0).value;
  await edit(2, '{');
  expect(field(0).value).toBe(original);
  expect(container.textContent).toContain('Payload JSON is invalid');
  await edit(2, '{"sub":"fixed"}');
  expect(JSON.parse(decodeJwtParts(field(0).value).payload)).toEqual({ sub: 'fixed' });
  expect(container.textContent).not.toContain('Payload JSON is invalid');
});

it('removes the signature when the header algorithm changes to none', async () => {
  await edit(1, '{"alg":"none","typ":"JWT"}');
  expect(field(0).value.split('.')[2]).toBe('');
  expect(container.querySelector('select')!.value).toBe('none');
});

it('still encodes edits when the supplied signing key is invalid', async () => {
  await edit(1, '{"alg":"RS256","typ":"JWT"}');
  await edit(3, 'invalid-private-key');
  await edit(2, '{"sub":"edited-with-invalid-key"}');
  expect(JSON.parse(decodeJwtParts(field(0).value).payload)).toEqual({
    sub: 'edited-with-invalid-key',
  });
  expect(container.textContent).not.toContain('Signature Verified');
});

it('does not let a delayed signature overwrite a newer encoded edit', async () => {
  let finishSigning!: (token: string) => void;
  jest.mocked(signJwt).mockImplementationOnce(() => new Promise(resolve => {
    finishSigning = resolve;
  }));
  await edit(2, '{"sub":"waiting-for-signature"}');
  await edit(0, 'new-incomplete-token');
  await act(async () => { finishSigning('old.signed.token'); });
  expect(field(0).value).toBe('new-incomplete-token');
});
