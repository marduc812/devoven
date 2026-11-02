import type { Metadata } from 'next';
import { YamlToJson } from '@/Components/Functions/DataFormatConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/yaml-to-json', {
  title: 'YAML to JSON converter | Parse YAML online | DevOven',
  description:
    'Convert a YAML document to formatted JSON online. Handle mappings and sequences, with guidance on quoted values, comments, aliases, and unsupported tags.',
});

export default function Page() {
  return (
    <YamlToJson
      article={
        <ToolArticle
          name="YAML to JSON converter"
          path="/converting/yaml-to-json"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Convert a YAML document to JSON',
              body: (
                <>
                  <p>
                    Paste one YAML document to convert it. For example,{' '}
                    <code>name: Alice</code> and <code>age: 30</code> on
                    separate lines becomes{' '}
                    <code>{'{"name":"Alice","age":30}'}</code>, displayed with
                    indentation. YAML mappings become JSON objects and sequences
                    become arrays.
                  </p>
                  <p>
                    The parser uses{' '}
                    <a
                      className="underline"
                      href="https://github.com/nodeca/js-yaml"
                    >
                      js-yaml's default schema
                    </a>
                    . Quote values that must stay strings, such as{' '}
                    <code>{'code: "0012"'}</code>. Unquoted values can resolve
                    to numbers, booleans, null, or dates. Inspect the output
                    types before using it in an API or configuration.
                  </p>
                </>
              ),
            },
            {
              heading: 'Know which YAML details JSON cannot keep',
              body: (
                <>
                  <p>
                    Comments and presentation details do not appear in JSON.
                    Anchors and aliases are resolved to data rather than
                    preserved as YAML syntax. Unknown custom tags and multiple
                    YAML documents produce an error. Circular alias structures
                    cannot be serialized as JSON.
                  </p>
                  <p>
                    This is a data conversion, so returning the output through
                    the{' '}
                    <a className="underline" href="/converting/json-to-yaml">
                      JSON to YAML converter
                    </a>{' '}
                    will not restore the original comments, aliases, or layout.
                    Use the{' '}
                    <a
                      className="underline"
                      href="/tools/json-schema-validator"
                    >
                      JSON Schema validator
                    </a>{' '}
                    if you also need to check supported constraints on the
                    converted values.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Are YAML comments included in the JSON?',
              answer:
                'No. Comments describe the YAML source and do not become JSON data. The converter also writes new formatting.',
            },
            {
              question: 'Can I convert several YAML documents at once?',
              answer:
                'No. This tool parses one document. Split a YAML stream into individual documents before converting it.',
            },
          ]}
        />
      }
    />
  );
}
