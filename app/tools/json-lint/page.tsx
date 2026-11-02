import type { Metadata } from 'next';
import { JsonLint } from '@/Components/Functions/JsonLintTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-lint', {
  title: 'JSON lint | Check JSON syntax online | DevOven',
  description:
    'Check whether JSON is valid online. Read parser errors and available locations, with help for trailing commas, quotes, comments, and schema validation.',
});

export default function Page() {
  return (
    <JsonLint
      article={
        <ToolArticle
          name="JSON lint and syntax checker"
          path="/tools/json-lint"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Find JSON syntax errors',
              body: (
                <>
                  <p>
                    Paste the JSON you want to check. Valid input produces a
                    confirmation with line and character counts. Invalid input
                    produces a parser error. Location details depend on the
                    error message supplied by your browser, so some errors do
                    not include a separate line and column.
                  </p>
                  <p>
                    For example, <code>{'{"enabled":true,}'}</code> fails
                    because of the trailing comma. Remove it to get{' '}
                    <code>{'{"enabled":true}'}</code>. Other common causes are
                    single-quoted strings, unquoted property names, comments,
                    and a missing closing brace. A JSON value can also be an
                    array, string, number, boolean, or <code>null</code>.
                  </p>
                </>
              ),
            },
            {
              heading: 'Decide what kind of validation you need',
              body: (
                <>
                  <p>
                    Syntax checking answers whether the text can be parsed as
                    JSON. It does not check an API contract, detect every
                    duplicate property, or prove that the data is correct. The
                    checker follows JavaScript's{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse"
                    >
                      JSON.parse behavior
                    </a>
                    .
                  </p>
                  <p>
                    Use the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    to indent a valid document. Use the{' '}
                    <a
                      className="underline"
                      href="/tools/json-schema-validator"
                    >
                      JSON Schema validator
                    </a>{' '}
                    for supported structural checks, such as required fields and
                    numeric bounds.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Can JSON contain comments or trailing commas?',
              answer:
                'No. Standard JSON rejects comments and trailing commas. Remove them before validating the document.',
            },
            {
              question: 'Why is there no line or column for an error?',
              answer:
                'The checker extracts a position when the browser includes one in its parser error. Some errors and browsers provide only a message.',
            },
          ]}
        />
      }
    />
  );
}
