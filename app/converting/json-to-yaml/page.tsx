import type { Metadata } from 'next';
import { JsonToYaml } from '@/Components/Functions/DataFormatConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-yaml', {
  title: 'JSON to YAML converter | Objects and arrays | DevOven',
  description:
    'Convert JSON to YAML online. Paste an object or array, inspect a conversion example, and learn how quoting, comments, and numeric precision affect the result.',
});

export default function Page() {
  return (
    <JsonToYaml
      article={
        <ToolArticle
          name="JSON to YAML converter"
          path="/converting/json-to-yaml"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Convert JSON objects and arrays to YAML',
              body: (
                <>
                  <p>
                    Paste valid JSON to generate YAML. For example,{' '}
                    <code>{'{"name":"Alice","roles":["editor"]}'}</code> becomes
                    a mapping with a <code>name: Alice</code> entry and a{' '}
                    <code>roles</code> sequence. Nested objects become indented
                    mappings and arrays become YAML sequences.
                  </p>
                  <p>
                    The converter parses JSON and uses{' '}
                    <a
                      className="underline"
                      href="https://github.com/nodeca/js-yaml"
                    >
                      js-yaml
                    </a>{' '}
                    to write the result. The writer adds quotes where its output
                    rules require them. A quoted value can still be the same
                    string as an unquoted value elsewhere.
                  </p>
                </>
              ),
            },
            {
              heading: 'Check data types before using configuration',
              body: (
                <>
                  <p>
                    JSON does not contain comments, anchors, or custom YAML
                    tags, so this conversion cannot invent those details. If the
                    JSON came from a YAML file, converting it back will not
                    restore its original comments or layout. Large numbers also
                    pass through JavaScript numeric parsing and can lose
                    precision.
                  </p>
                  <p>
                    Use the{' '}
                    <a className="underline" href="/converting/yaml-to-json">
                      YAML to JSON converter
                    </a>{' '}
                    for the reverse direction. To generate a Kubernetes resource
                    from form fields, use the{' '}
                    <a className="underline" href="/tools/k8s-yaml">
                      Kubernetes YAML generator
                    </a>
                    . To inspect invalid source JSON, use the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Can this generate Kubernetes YAML from any JSON?',
              answer:
                'It converts the JSON structure to YAML but does not add or validate Kubernetes resource fields. Use the Kubernetes YAML generator for supported resource templates.',
            },
            {
              question: 'Will the YAML keep the original JSON formatting?',
              answer:
                'No. The converter writes a new YAML representation. Whitespace and layout change while the parsed values determine the output.',
            },
          ]}
        />
      }
    />
  );
}
