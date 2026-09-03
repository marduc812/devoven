import { Buffer } from 'buffer';
import { Operation } from '../types';

const urlEncode: Operation = {
  id: 'url-encode',
  name: 'URL Encode',
  category: 'encoding',
  params: [],
  fn: (input) => encodeURIComponent(input),
};

const urlDecode: Operation = {
  id: 'url-decode',
  name: 'URL Decode',
  category: 'encoding',
  params: [],
  fn: (input) => decodeURIComponent(input),
};

const htmlEncode: Operation = {
  id: 'html-encode',
  name: 'HTML Encode',
  category: 'encoding',
  params: [],
  fn: (input) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'),
};

const htmlDecode: Operation = {
  id: 'html-decode',
  name: 'HTML Decode',
  category: 'encoding',
  params: [],
  fn: (input) => {
    const area = document.createElement('textarea');
    area.innerHTML = input;
    return area.value;
  },
};

const base64Encode: Operation = {
  id: 'base64-encode',
  name: 'Base64 Encode',
  category: 'encoding',
  params: [
    {
      id: 'encoding',
      label: 'Input Encoding',
      kind: 'select',
      options: [
        { value: 'utf-8', label: 'UTF-8' },
        { value: 'utf16le', label: 'UTF16-LE' },
        { value: 'ascii', label: 'ASCII' },
        { value: 'hex', label: 'HEX' },
      ],
      default: 'utf-8',
    },
  ],
  fn: (input, params) =>
    Buffer.from(input, (params.encoding || 'utf-8') as BufferEncoding).toString('base64'),
};

const base64Decode: Operation = {
  id: 'base64-decode',
  name: 'Base64 Decode',
  category: 'encoding',
  params: [
    {
      id: 'encoding',
      label: 'Output Encoding',
      kind: 'select',
      options: [
        { value: 'utf-8', label: 'UTF-8' },
        { value: 'utf16le', label: 'UTF16-LE' },
        { value: 'ascii', label: 'ASCII' },
        { value: 'hex', label: 'HEX' },
      ],
      default: 'utf-8',
    },
  ],
  fn: (input, params) =>
    Buffer.from(input, 'base64').toString((params.encoding || 'utf-8') as BufferEncoding),
};

export const encodingOperations: Operation[] = [
  urlEncode,
  urlDecode,
  htmlEncode,
  htmlDecode,
  base64Encode,
  base64Decode,
];
