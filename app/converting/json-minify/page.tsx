import type { Metadata } from 'next';
import { JsonMinify } from '@/Components/Functions/JsonMinifyTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-minify', {
  title: 'JSON minifier and beautifier | Compact JSON online | DevOven',
  description:
    'Minify JSON or beautify it with spaces or tabs. Compare UTF-8 byte sizes and copy JSON output without the size report mixed into the data.',
});

export default function Page() {
  return (
    <JsonMinify
      article={
        <ToolArticle
          name="JSON minifier and beautifier"
          path="/converting/json-minify"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Remove formatting whitespace from JSON',
              body: (
                <>
                  <p>
                    Paste valid JSON and leave Minify selected. The input{' '}
                    <code>{'{ "name": "Alice", "active": true }'}</code> becomes{' '}
                    <code>{'{"name":"Alice","active":true}'}</code>. Spaces
                    inside string values remain, so{' '}
                    <code>{'{"name":"Alice Smith"}'}</code> keeps the space
                    between the names.
                  </p>
                  <p>
                    Select a beautify mode to make the same parsed data easier
                    to read. Copy the JSON from the output field. The byte-size
                    report appears separately and compares the minified
                    representation with a 2-space representation, regardless of
                    the selected output mode.
                  </p>
                </>
              ),
            },
            {
              heading: 'Understand what parsing can change',
              body: (
                <>
                  <p>
                    This tool parses and serializes JSON. It can normalize
                    numeric notation and escape sequences, and duplicate object
                    keys reduce to their last value. JavaScript may round
                    integers beyond its safe range. Store large IDs as strings
                    if every digit must survive a conversion.
                  </p>
                  <p>
                    Minification removes formatting rather than compressing the
                    data with an archive format. The size report measures UTF-8
                    bytes, not network transfer size. Use the{' '}
                    <a className="underline" href="/tools/json-lint">
                      JSON syntax checker
                    </a>{' '}
                    to investigate invalid input or the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    for a simpler indentation tool.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does minifying remove spaces inside strings?',
              answer:
                'No. Whitespace inside a JSON string is data and remains in the output. Minification removes formatting around JSON values.',
            },
            {
              question: 'What does the savings figure compare?',
              answer:
                'It compares the UTF-8 byte sizes of the minified output and the 2-space beautified output. It does not measure savings against the original input or a compressed network response.',
            },
          ]}
        />
      }
    />
  );
}
