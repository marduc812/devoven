import { minifyJson, beautifyJson } from '@/Components/Functions/JsonMinifyTools/logic';
import { sortJsonKeys } from '@/Components/Functions/JsonSortTools/logic';
import { jsonlToJson, jsonToJsonl } from '@/Components/Functions/JsonlParserTools/logic';
import { formatSql } from '@/Components/Functions/SqlFormatterTools/logic';
import { formatGraphQL } from '@/Components/Functions/GraphqlFormatterTools/logic';
import { minifyCode, CodeLanguage } from '@/Components/Functions/CodeMinifierTools/logic';
import { htmlToJsx } from '@/Components/Functions/HtmlToJsxTools/logic';
import { cleanSvg } from '@/Components/Functions/SvgCleanerTools/logic';
import { svgToDataUri } from '@/Components/Functions/ExtraConverters2/logic';
import {
  flattenJson, unflattenJson,
  iniToJson, jsonToIni,
  yamlToToml, tomlToYaml,
} from '@/Components/Functions/ExtraConverters/logic';
import { propertiesToJson, jsonToProperties } from '@/Components/Functions/PropertiesJsonTools/logic';
import { jsonToSqlInsert } from '@/Components/Functions/ExtraConverters3/logic';
import { Operation } from '../types';

export const dataExtraOperations: Operation[] = [
  {
    id: 'json-minify',
    name: 'JSON Minify',
    category: 'data',
    params: [],
    fn: (input) => minifyJson(input),
  },
  {
    id: 'json-beautify',
    name: 'JSON Beautify',
    category: 'data',
    params: [
      {
        id: 'indent',
        label: 'Indent',
        kind: 'select',
        options: [
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'tab', label: 'Tab' },
        ],
        default: '2',
      },
    ],
    fn: (input, p) => beautifyJson(input, p.indent === 'tab' ? '\t' : parseInt(p.indent ?? '2')),
  },
  {
    id: 'json-sort-keys',
    name: 'JSON Sort Keys',
    category: 'data',
    params: [],
    fn: (input) => sortJsonKeys(input),
  },
  {
    id: 'json-flatten',
    name: 'JSON Flatten',
    category: 'data',
    params: [],
    fn: (input) => flattenJson(input),
  },
  {
    id: 'json-unflatten',
    name: 'JSON Unflatten',
    category: 'data',
    params: [],
    fn: (input) => unflattenJson(input),
  },
  {
    id: 'jsonl-to-json',
    name: 'JSONL → JSON',
    category: 'data',
    params: [],
    fn: (input) => jsonlToJson(input),
  },
  {
    id: 'json-to-jsonl',
    name: 'JSON → JSONL',
    category: 'data',
    params: [],
    fn: (input) => jsonToJsonl(input),
  },
  {
    id: 'ini-to-json',
    name: 'INI → JSON',
    category: 'data',
    params: [],
    fn: (input) => iniToJson(input),
  },
  {
    id: 'json-to-ini',
    name: 'JSON → INI',
    category: 'data',
    params: [],
    fn: (input) => jsonToIni(input),
  },
  {
    id: 'properties-to-json',
    name: 'Properties → JSON',
    category: 'data',
    params: [],
    fn: (input) => propertiesToJson(input),
  },
  {
    id: 'json-to-properties',
    name: 'JSON → Properties',
    category: 'data',
    params: [],
    fn: (input) => jsonToProperties(input),
  },
  {
    id: 'yaml-to-toml',
    name: 'YAML → TOML',
    category: 'data',
    params: [],
    fn: (input) => yamlToToml(input),
  },
  {
    id: 'toml-to-yaml',
    name: 'TOML → YAML',
    category: 'data',
    params: [],
    fn: (input) => tomlToYaml(input),
  },
  {
    id: 'json-to-sql-insert',
    name: 'JSON → SQL INSERT',
    category: 'data',
    params: [{ id: 'table', label: 'Table name', kind: 'text', default: 'table_name' }],
    fn: (input, p) => jsonToSqlInsert(input, p.table || 'table_name'),
  },
  {
    id: 'sql-format',
    name: 'SQL Formatter',
    category: 'data',
    params: [],
    fn: (input) => formatSql(input),
  },
  {
    id: 'graphql-format',
    name: 'GraphQL Formatter',
    category: 'data',
    params: [],
    fn: (input) => formatGraphQL(input),
  },
  {
    id: 'code-minify',
    name: 'Minify JS / CSS',
    category: 'data',
    params: [
      {
        id: 'lang',
        label: 'Language',
        kind: 'select',
        options: [
          { value: 'auto', label: 'Auto-detect' },
          { value: 'js', label: 'JavaScript' },
          { value: 'css', label: 'CSS' },
        ],
        default: 'auto',
      },
    ],
    fn: (input, p) => minifyCode(input, (p.lang ?? 'auto') as CodeLanguage).minified,
  },
  {
    id: 'html-to-jsx',
    name: 'HTML → JSX',
    category: 'data',
    params: [],
    fn: (input) => htmlToJsx(input),
  },
  {
    id: 'svg-clean',
    name: 'SVG Cleaner',
    category: 'data',
    params: [],
    fn: (input) => cleanSvg(input),
  },
  {
    id: 'svg-to-data-uri',
    name: 'SVG → Data URI',
    category: 'data',
    params: [],
    fn: (input) => svgToDataUri(input),
  },
];
