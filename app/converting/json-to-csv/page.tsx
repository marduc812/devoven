import type { Metadata } from 'next';
import { JsonToCsv } from '@/Components/Functions/DataFormatConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-csv', {
  title: 'JSON to CSV converter | Array of objects to CSV | DevOven',
  description:
    'Convert a JSON array of flat objects to CSV online. Learn how the first row sets columns, how missing values appear, and when nested data needs preparation.',
});

export default function Page() {
  return (
    <JsonToCsv
      article={
        <ToolArticle
          name="JSON to CSV converter"
          path="/converting/json-to-csv"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Turn a JSON array into CSV rows',
              body: (
                <>
                  <p>
                    Use a nonempty array of flat objects. For example,{' '}
                    <code>
                      {'[{"name":"Alice","age":30},{"name":"Bob","age":25}]'}
                    </code>{' '}
                    becomes a CSV header <code>name,age</code> followed by{' '}
                    <code>Alice,30</code> and <code>Bob,25</code> on separate
                    lines.
                  </p>
                  <p>
                    The first object's keys define the columns and their order.
                    A field that appears only in a later object is omitted.
                    Missing and null values produce empty cells. Use the same
                    simple column names in each row, and flatten nested data
                    before conversion.
                  </p>
                </>
              ),
            },
            {
              heading: 'Review quoting and type changes',
              body: (
                <>
                  <p>
                    Data cells containing commas, double quotes, or line breaks
                    are quoted, and a double quote inside a quoted value is
                    doubled. CSV has no built-in distinction between a number
                    and numeric text. Nested objects and arrays are converted to
                    strings rather than expanded into extra columns.
                  </p>
                  <p>
                    The{' '}
                    <a className="underline" href="/converting/csv-to-json">
                      CSV to JSON converter
                    </a>{' '}
                    reads values as strings and expects one record per line, so
                    a round trip can change types and cannot restore nested
                    structure. Use the{' '}
                    <a className="underline" href="/converting/json-flatten">
                      JSON flattener
                    </a>{' '}
                    to inspect nested fields first, or the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    to check the source.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Which JSON keys become CSV columns?',
              answer:
                'Only the keys of the first object define the columns. Add every desired key to that first object before converting.',
            },
            {
              question: 'Will nested JSON objects become separate columns?',
              answer:
                'No. This converter stringifies nested values. Flatten the data into simple fields before converting it to CSV.',
            },
          ]}
        />
      }
    />
  );
}
