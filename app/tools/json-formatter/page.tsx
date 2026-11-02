import type { Metadata } from 'next';
import { JsonFormatter } from '@/Components/Functions/CodeFormatters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-formatter', {
  title: 'JSON formatter and validator | Pretty-print JSON | DevOven',
  description:
    'Format JSON online with 2-space or 4-space indentation. Check JSON syntax, read parse errors, and pretty-print compact objects and arrays.',
});

export default function Page() {
  return (
    <JsonFormatter
      article={
        <ToolArticle
          name="JSON formatter and validator"
          path="/tools/json-formatter"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Pretty-print JSON for inspection',
              body: (
                <>
                  <p>
                    Paste a JSON value and select 2 or 4 spaces of indentation.
                    The formatter parses the input, then writes a new JSON
                    representation. Compact input such as{' '}
                    <code>{'{"name":"Alice","roles":["editor"]}'}</code> becomes
                    a multiline object with its nested array indented.
                  </p>
                  <p>
                    If parsing fails, the output shows the browser's error
                    message. Property names and strings need double quotes.
                    Comments, trailing commas, <code>undefined</code>, and
                    JavaScript object literals are not valid JSON. Use{' '}
                    <a className="underline" href="/tools/json-lint">
                      JSON lint
                    </a>{' '}
                    for a dedicated syntax report.
                  </p>
                </>
              ),
            },
            {
              heading: 'Check syntax and schema separately',
              body: (
                <>
                  <p>
                    Valid JSON syntax does not tell you whether a value meets an
                    API's contract. An object can parse correctly while missing
                    a required property. Use the{' '}
                    <a
                      className="underline"
                      href="/tools/json-schema-validator"
                    >
                      JSON Schema validator
                    </a>{' '}
                    to check the supported schema rules, or the{' '}
                    <a className="underline" href="/converting/json-minify">
                      JSON minifier
                    </a>{' '}
                    to remove formatting whitespace.
                  </p>
                  <p>
                    This formatter uses JavaScript parsing and serialization.
                    Large integer values can lose precision, duplicate keys
                    collapse to the last value, and numeric notation can change.
                    Keep identifiers that exceed JavaScript's safe integer range
                    in strings. See the{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse"
                    >
                      JSON.parse documentation
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does formatting fix invalid JSON?',
              answer:
                'No. The formatter reports a parse error. Correct the input syntax before formatting it.',
            },
            {
              question: 'Does this validate a JSON Schema?',
              answer:
                'No. It checks JSON syntax. Use the separate JSON Schema validator to check supported constraints such as required properties and value types.',
            },
          ]}
        />
      }
    />
  );
}
