import {
  jsonToYaml, yamlToJson,
  jsonToXml, xmlToJson,
  jsonToCsv, csvToJson,
  jsonToToml, tomlToJson,
  csvToMarkdownTable, markdownTableToCsv,
  markdownToHtml, htmlToMarkdown,
  jsonToTypeScriptInterface, jsonToGoStruct, jsonToZodSchema,
} from '@/Components/Functions/DataFormatConverters/logic';
import { Operation } from '../types';

function formatJsonInline(input: string, indent: number): string {
  if (!input.trim()) return '';
  return JSON.stringify(JSON.parse(input), null, indent);
}

export const dataFormatOperations: Operation[] = [
  {
    id: 'json-to-yaml',
    name: 'JSON \u2192 YAML',
    category: 'data',
    params: [],
    fn: (input) => jsonToYaml(input),
  },
  {
    id: 'yaml-to-json',
    name: 'YAML \u2192 JSON',
    category: 'data',
    params: [],
    fn: (input) => yamlToJson(input),
  },
  {
    id: 'json-to-xml',
    name: 'JSON \u2192 XML',
    category: 'data',
    params: [],
    fn: (input) => jsonToXml(input),
  },
  {
    id: 'xml-to-json',
    name: 'XML \u2192 JSON',
    category: 'data',
    params: [],
    fn: (input) => xmlToJson(input),
  },
  {
    id: 'json-to-csv',
    name: 'JSON \u2192 CSV',
    category: 'data',
    params: [],
    fn: (input) => jsonToCsv(input),
  },
  {
    id: 'csv-to-json',
    name: 'CSV \u2192 JSON',
    category: 'data',
    params: [],
    fn: (input) => csvToJson(input),
  },
  {
    id: 'json-to-toml',
    name: 'JSON \u2192 TOML',
    category: 'data',
    params: [],
    fn: (input) => jsonToToml(input),
  },
  {
    id: 'toml-to-json',
    name: 'TOML \u2192 JSON',
    category: 'data',
    params: [],
    fn: (input) => tomlToJson(input),
  },
  {
    id: 'csv-to-markdown',
    name: 'CSV \u2192 Markdown Table',
    category: 'data',
    params: [],
    fn: (input) => csvToMarkdownTable(input),
  },
  {
    id: 'markdown-to-csv',
    name: 'Markdown Table \u2192 CSV',
    category: 'data',
    params: [],
    fn: (input) => markdownTableToCsv(input),
  },
  {
    id: 'markdown-to-html',
    name: 'Markdown \u2192 HTML',
    category: 'data',
    params: [],
    fn: (input) => markdownToHtml(input),
  },
  {
    id: 'html-to-markdown',
    name: 'HTML \u2192 Markdown',
    category: 'data',
    params: [],
    fn: (input) => htmlToMarkdown(input),
  },
  {
    id: 'json-to-typescript',
    name: 'JSON \u2192 TypeScript Interface',
    category: 'data',
    params: [],
    fn: (input) => jsonToTypeScriptInterface(input),
  },
  {
    id: 'json-to-go',
    name: 'JSON \u2192 Go Struct',
    category: 'data',
    params: [],
    fn: (input) => jsonToGoStruct(input),
  },
  {
    id: 'json-to-zod',
    name: 'JSON \u2192 Zod Schema',
    category: 'data',
    params: [],
    fn: (input) => jsonToZodSchema(input),
  },
  {
    id: 'json-format',
    name: 'JSON Formatter',
    category: 'data',
    params: [
      {
        id: 'indent',
        label: 'Indent',
        kind: 'select',
        options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
        ],
        default: '2',
      },
    ],
    fn: (input, params) => formatJsonInline(input, parseInt(params.indent ?? '2')),
  },
];
