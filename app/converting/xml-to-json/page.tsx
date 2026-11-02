import type { Metadata } from 'next';
import { XmlJsonConverter } from '@/Components/Functions/XmlJsonTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/xml-to-json', {
  title: 'XML to JSON converter | Attributes and arrays | DevOven',
  description:
    'Convert XML to JSON online. Map attributes to @ keys, text to _text, and repeated elements to arrays. Inspect examples and conversion limits.',
});

export default function Page() {
  return (
    <XmlJsonConverter
      article={
        <ToolArticle
          name="XML to JSON converter"
          path="/converting/xml-to-json"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Read XML attributes and repeated elements as JSON',
              body: (
                <>
                  <p>
                    Paste XML and leave Auto-detect selected, or choose XML to
                    JSON. The input <code>{'<user id="7">Alice</user>'}</code>{' '}
                    becomes{' '}
                    <code>{'{"user":{"@id":"7","_text":"Alice"}}'}</code>. A
                    simple element with no attributes or children becomes a
                    string value.
                  </p>
                  <p>
                    Repeated sibling tags become arrays. For example,{' '}
                    <code>{'<root><item>a</item><item>b</item></root>'}</code>{' '}
                    becomes <code>{'{"root":{"item":["a","b"]}}'}</code>.
                    Numeric-looking text stays a string. The parser keeps the
                    root element name as the outer JSON key.
                  </p>
                </>
              ),
            },
            {
              heading: 'Understand the limits of the XML mapping',
              body: (
                <>
                  <p>
                    This lightweight parser omits comments and processing
                    instructions. It trims surrounding text whitespace and does
                    not preserve the original order of mixed text and child
                    elements. It is a converter rather than a strict XML
                    validator. Check document syntax with the{' '}
                    <a className="underline" href="/converting/xml-validator">
                      XML validator
                    </a>
                    .
                  </p>
                  <p>
                    The JSON to XML direction on this page reads{' '}
                    <code>@name</code> as an attribute and <code>_text</code> as
                    text. Supply one outer key as the document element. The
                    separate{' '}
                    <a className="underline" href="/converting/json-to-xml">
                      JSON to XML page
                    </a>{' '}
                    uses a root wrapper and a different mapping. Use the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    to inspect larger results.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How are XML attributes represented in JSON?',
              answer:
                'An attribute such as id="7" becomes a JSON property named @id with the string value 7. Text alongside attributes becomes an _text property.',
            },
            {
              question: 'Is XML to JSON conversion lossless?',
              answer:
                'No. This mapping omits comments and processing instructions, trims text, and cannot preserve mixed-content order. Keep the original XML when those details matter.',
            },
          ]}
        />
      }
    />
  );
}
