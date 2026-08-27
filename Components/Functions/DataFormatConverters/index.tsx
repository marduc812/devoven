'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import {
  jsonToYaml, yamlToJson,
  jsonToXml, xmlToJson,
  jsonToCsv, csvToJson,
  jsonToToml, tomlToJson,
  csvToXml, xmlToCsv,
  csvToMarkdownTable, markdownTableToCsv,
  tableDataToCsv, tableDataToJson,
  jsonToTypeScriptInterface, jsonToGoStruct, jsonToRustStruct, jsonToZodSchema,
  markdownToHtml, htmlToMarkdown,
} from './logic';

export const JsonToYaml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(jsonToYaml(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid JSON' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON to YAML Converter"
      description="Convert JSON to YAML format. Paste your JSON and get the YAML equivalent instantly. For example, [1 {&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30} 2] becomes [1 name: Alice age: 30 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON"
      toTitle="YAML"
      swapLink="/converting/yaml-to-json"
      backColor="cyan"
    />
  );
};

export const YamlToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(yamlToJson(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid YAML' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="YAML to JSON Converter"
      description="Convert YAML to JSON format. Paste your YAML and get the JSON equivalent instantly. For example, [1 name: Alice age: 30 2] becomes [1 {&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30} 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="YAML"
      toTitle="JSON"
      swapLink="/converting/json-to-yaml"
      backColor="cyan"
    />
  );
};

export const JsonToXml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(jsonToXml(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid JSON' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON to XML Converter"
      description="Convert JSON to XML format. Paste your JSON and get valid XML instantly. The JSON is wrapped in a [1 root 2] element."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON"
      toTitle="XML"
      swapLink="/converting/xml-to-json"
      backColor="cyan"
    />
  );
};

export const JsonToCsv = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(jsonToCsv(fromValue));
    } catch {
      setToValue(fromValue ? 'Input must be a JSON array of objects' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON to CSV Converter"
      description="Convert a JSON array of objects to CSV format. For example, [1 [{&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30}] 2] becomes [1 name,age Alice,30 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Array"
      toTitle="CSV"
      swapLink="/converting/csv-to-json"
      backColor="cyan"
    />
  );
};

export const CsvToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(csvToJson(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid CSV' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="CSV to JSON Converter"
      description="Convert CSV data to a JSON array of objects. The first row is treated as headers. For example, [1 name,age Alice,30 2] becomes [1 [{&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:&quot;30&quot;}] 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="CSV"
      toTitle="JSON"
      swapLink="/converting/json-to-csv"
      backColor="cyan"
    />
  );
};

export const JsonToToml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(jsonToToml(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid JSON' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="JSON to TOML Converter"
      description="Convert JSON to TOML format. For example, [1 {&quot;host&quot;:&quot;localhost&quot;,&quot;port&quot;:5432} 2] becomes [1 host = &quot;localhost&quot; port = 5432 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="JSON" toTitle="TOML" swapLink="/converting/toml-to-json" backColor="cyan"
    />
  );
};

export const TomlToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(tomlToJson(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid TOML' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="TOML to JSON Converter"
      description="Convert TOML to JSON format. For example, [1 host = &quot;localhost&quot; port = 5432 2] becomes [1 {&quot;host&quot;:&quot;localhost&quot;,&quot;port&quot;:5432} 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="TOML" toTitle="JSON" swapLink="/converting/json-to-toml" backColor="cyan"
    />
  );
};

export const CsvToXml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(csvToXml(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid CSV' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="CSV to XML Converter"
      description="Convert CSV data to XML format. The first row becomes element tag names, each subsequent row becomes a [1 row 2] element."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="CSV" toTitle="XML" swapLink="/converting/xml-to-csv" backColor="cyan"
    />
  );
};

export const XmlToCsv = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(xmlToCsv(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid XML' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="XML to CSV Converter"
      description="Convert XML data to CSV format. Works best with flat, tabular XML where each child element represents a row."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="XML" toTitle="CSV" swapLink="/converting/csv-to-xml" backColor="cyan"
    />
  );
};

export const CsvToMarkdownTable = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(csvToMarkdownTable(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid CSV' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="CSV to Markdown Table"
      description="Convert CSV data to a Markdown table. The first CSV row becomes the table headers. For example, [1 name,age\nAlice,30 2] becomes a formatted Markdown table."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="CSV" toTitle="Markdown Table" swapLink="/converting/markdown-table-to-csv" backColor="cyan"
    />
  );
};

const extractTableData = (html: string): { headers: string[]; rows: string[][] } | null => {
  if (typeof window === 'undefined') return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;
  const allRows = Array.from(table.querySelectorAll('tr'));
  if (allRows.length === 0) return null;
  const headers = Array.from(allRows[0].querySelectorAll('th,td')).map(
    el => el.textContent?.trim() ?? ''
  );
  const rows = allRows.slice(1).map(row =>
    Array.from(row.querySelectorAll('td')).map(el => el.textContent?.trim() ?? '')
  );
  return { headers, rows };
};

export const HtmlTableToCsv = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    const data = extractTableData(fromValue);
    if (!data) { setToValue('No <table> element found in HTML'); return; }
    setToValue(tableDataToCsv(data.headers, data.rows));
  }, [fromValue]);
  return (
    <BasicConverter
      title="HTML Table to CSV"
      description="Extract a table from HTML and convert it to CSV. Paste HTML containing a [1 &lt;table&gt; 2] element and get CSV output with the table data."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="HTML" toTitle="CSV" backColor="cyan"
    />
  );
};

export const HtmlTableToJson = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    const data = extractTableData(fromValue);
    if (!data) { setToValue('No <table> element found in HTML'); return; }
    setToValue(tableDataToJson(data.headers, data.rows));
  }, [fromValue]);
  return (
    <BasicConverter
      title="HTML Table to JSON"
      description="Extract a table from HTML and convert it to a JSON array. Paste HTML containing a [1 &lt;table&gt; 2] element and get a JSON array of objects."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="HTML" toTitle="JSON" backColor="cyan"
    />
  );
};

export const JsonToTypeScript = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(jsonToTypeScriptInterface(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid JSON' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="JSON to TypeScript Interface"
      description="Generate a TypeScript interface from a JSON object. For example, [1 {&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30} 2] generates an interface with [1 name: string; age: number; 2] fields."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="JSON Object" toTitle="TypeScript Interface" backColor="cyan"
    />
  );
};

export const JsonToGoStruct = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(jsonToGoStruct(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid JSON' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="JSON to Go Struct"
      description="Generate a Go struct definition from a JSON object. JSON tags are included automatically. For example, [1 {&quot;user_id&quot;:1} 2] generates [1 UserId int `json:&quot;user_id&quot;` 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="JSON Object" toTitle="Go Struct" backColor="cyan"
    />
  );
};

export const JsonToRustStruct = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(jsonToRustStruct(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid JSON' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="JSON to Rust Struct"
      description="Generate a Rust struct definition from a JSON object. Includes serde Serialize/Deserialize derive macros. For example, [1 {&quot;name&quot;:&quot;Alice&quot;} 2] generates [1 pub name: String 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="JSON Object" toTitle="Rust Struct" backColor="cyan"
    />
  );
};

export const JsonToZod = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(jsonToZodSchema(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid JSON' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="JSON to Zod Schema"
      description="Generate a Zod schema and TypeScript type from a JSON object. For example, [1 {&quot;name&quot;:&quot;Alice&quot;,&quot;age&quot;:30} 2] generates [1 z.object({ name: z.string(), age: z.number() }) 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="JSON Object" toTitle="Zod Schema" backColor="cyan"
    />
  );
};

export const MarkdownTableToCsv = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(markdownTableToCsv(fromValue)); }
    catch { setToValue(fromValue ? 'Invalid Markdown table' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="Markdown Table to CSV"
      description="Convert a Markdown table to CSV format. Paste a standard Markdown table (with header, separator row, and data rows) and get CSV output."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="Markdown Table" toTitle="CSV" swapLink="/converting/csv-to-markdown-table" backColor="cyan"
    />
  );
};

export const MarkdownToHtml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(markdownToHtml(fromValue)); }
    catch { setToValue(fromValue ? 'Conversion error' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="Markdown to HTML Converter"
      description="Convert Markdown to HTML. For example, [1 # Hello 2] becomes [1 &lt;h1&gt;Hello&lt;/h1&gt; 2] and [1 **bold** 2] becomes [1 &lt;strong&gt;bold&lt;/strong&gt; 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="Markdown" toTitle="HTML" swapLink="/converting/html-to-markdown" backColor="cyan"
    />
  );
};

export const HtmlToMarkdown = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);
  useEffect(() => {
    try { setToValue(htmlToMarkdown(fromValue)); }
    catch { setToValue(fromValue ? 'Conversion error' : ''); }
  }, [fromValue]);
  return (
    <BasicConverter
      title="HTML to Markdown Converter"
      description="Convert HTML to Markdown. For example, [1 &lt;h1&gt;Hello&lt;/h1&gt; 2] becomes [1 # Hello 2] and [1 &lt;strong&gt;bold&lt;/strong&gt; 2] becomes [1 **bold** 2]."
      fromValue={fromValue} toValue={toValue} setFromValue={setFromValue}
      fromTitle="HTML" toTitle="Markdown" swapLink="/converting/markdown-to-html" backColor="cyan"
    />
  );
};
