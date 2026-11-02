import type { Metadata } from 'next';
import { JsonToXml } from '@/Components/Functions/DataFormatConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/json-to-xml', {
  title: 'JSON to XML converter | Generate XML from JSON | DevOven',
  description:
    'Convert JSON to XML online with a root wrapper and indented elements. See array examples and check the limits of JSON keys, attributes, and round trips.',
});

export default function Page() {
  return (
    <JsonToXml
      article={
        <ToolArticle
          name="JSON to XML converter"
          path="/converting/json-to-xml"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Generate XML elements from JSON data',
              body: (
                <>
                  <p>
                    Paste a valid JSON object with keys that can serve as XML
                    element names. The converter adds an XML declaration and
                    wraps the result in a <code>root</code> element. For
                    example, <code>{'{"name":"Alice","age":30}'}</code> produces{' '}
                    <code>
                      {'<root><name>Alice</name><age>30</age></root>'}
                    </code>
                    , with indentation.
                  </p>
                  <p>
                    An array value creates repeated sibling elements. For
                    example, <code>{'{"item":["a","b"]}'}</code> gives two{' '}
                    <code>item</code> elements under the wrapper. The writer
                    uses{' '}
                    <a
                      className="underline"
                      href="https://github.com/NaturalIntelligence/fast-xml-parser"
                    >
                      fast-xml-parser's XML builder
                    </a>{' '}
                    with its default element mapping.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose a mapping before exchanging XML',
              body: (
                <>
                  <p>
                    JSON and XML do not have a single universal conversion
                    mapping. This tool does not configure attributes, namespace
                    bindings, or an XML Schema. JSON keys containing spaces or
                    other characters forbidden in XML names need to be renamed
                    before conversion. A successful JSON parse does not
                    guarantee a valid XML document.
                  </p>
                  <p>
                    The separate{' '}
                    <a className="underline" href="/converting/xml-to-json">
                      XML to JSON converter
                    </a>{' '}
                    uses <code>@</code> for attributes and <code>_text</code>{' '}
                    for text content. Its mapping differs from this writer, so
                    do not expect an exact round trip. Check the generated
                    document with the{' '}
                    <a className="underline" href="/converting/xml-validator">
                      XML validator
                    </a>{' '}
                    before sending it to a receiver.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Why is there a root element?',
              answer:
                'XML needs a document element. This converter wraps the JSON representation in a root element and adds an XML declaration.',
            },
            {
              question: 'Does this preserve JSON value types in XML?',
              answer:
                'XML element text does not carry JSON number or boolean types by itself. The receiving application needs its own rules or schema to interpret those values.',
            },
          ]}
        />
      }
    />
  );
}
