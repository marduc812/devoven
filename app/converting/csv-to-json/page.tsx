import type { Metadata } from 'next';
import { CsvToJson } from '@/Components/Functions/DataFormatConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/csv-to-json', {
  title: 'CSV to JSON converter | Header rows to objects | DevOven',
  description:
    'Convert comma-separated rows to a JSON array online. Use the first row as headers, keep cell values as strings, and check quoting and multiline limitations.',
});

export default function Page() {
  return (
    <CsvToJson
      article={
        <ToolArticle
          name="CSV to JSON converter"
          path="/converting/csv-to-json"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Use the first CSV row as JSON keys',
              body: (
                <>
                  <p>
                    Paste comma-separated data with a header row and one record
                    per line. For example, <code>name,age</code> followed by{' '}
                    <code>Alice,30</code> on the next line becomes{' '}
                    <code>{'[{"name":"Alice","age":"30"}]'}</code>, displayed
                    with indentation. The age stays a string, rather than
                    becoming a number.
                  </p>
                  <p>
                    Use unique header names. A missing cell becomes an empty
                    string, and values beyond the header count are ignored.
                    Empty data lines are skipped. This tool expects commas as
                    separators and does not automatically detect tabs or
                    semicolons.
                  </p>
                </>
              ),
            },
            {
              heading: 'Check quoted fields and line breaks',
              body: (
                <>
                  <p>
                    The parser handles commas inside quoted fields and doubled
                    double quotes. For example, <code>{'"Smith, Alice"'}</code>{' '}
                    is one field, and <code>{'"She said ""hello"""'}</code>{' '}
                    contains literal quote characters. It splits records on line
                    breaks, so quoted fields that span multiple lines are not
                    supported.
                  </p>
                  <p>
                    Conversion is not a strict CSV validation report. Check the
                    resulting fields against your source before importing them.
                    Use the{' '}
                    <a className="underline" href="/converting/json-to-csv">
                      JSON to CSV converter
                    </a>{' '}
                    for the reverse direction, or the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    to inspect the resulting structure.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Will numbers and booleans keep their types?',
              answer:
                'All CSV values become JSON strings, including numeric text, true, and false. Convert the fields to the required types in your application.',
            },
            {
              question: 'Does this handle multiline quoted CSV fields?',
              answer:
                'No. It expects one record per physical line. Commas and doubled quotes within a single-line quoted field are supported.',
            },
          ]}
        />
      }
    />
  );
}
