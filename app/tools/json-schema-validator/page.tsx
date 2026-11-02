import type { Metadata } from 'next';
import { JsonSchemaValidator } from '@/Components/Functions/JsonSchemaTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/json-schema-validator', {
  title: 'JSON Schema validation online | Free validator | DevOven',
  description:
    'Validate JSON against a schema online. Check types, required fields, ranges, patterns, and array items with readable errors. See supported keyword limits.',
});

export default function Page() {
  return (
    <JsonSchemaValidator
      article={
        <ToolArticle
          name="Online JSON Schema validator"
          path="/tools/json-schema-validator"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Validate JSON against a schema online',
              body: (
                <>
                  <p>
                    Put the schema in the left field and the JSON data in the
                    right field, then select Validate. The result reports
                    invalid JSON separately from schema validation errors. Error
                    paths such as <code>root.age</code> show which value failed
                    a supported rule.
                  </p>
                  <p>
                    For example, a schema with{' '}
                    <code>
                      {
                        '{"type":"object","required":["name"],"properties":{"name":{"type":"string"}}}'
                      }
                    </code>{' '}
                    accepts <code>{'{"name":"Alice"}'}</code>. An empty object
                    fails because the required property is missing. A numeric
                    name fails the string type check.
                  </p>
                </>
              ),
            },
            {
              heading: 'Which JSON Schema keywords are supported?',
              body: (
                <>
                  <p>
                    This checker implements a subset of draft-07 validation
                    keywords. It checks types, enum values, required properties,
                    nested properties, numeric bounds, string lengths and
                    patterns, array item schemas, and minimum or maximum array
                    lengths. It also rejects extra object fields when{' '}
                    <code>additionalProperties</code> is false and{' '}
                    <code>properties</code> is present.
                  </p>
                  <p>
                    It does not resolve <code>$ref</code> or evaluate{' '}
                    <code>allOf</code>, <code>anyOf</code>, <code>oneOf</code>,
                    conditionals, or <code>format</code>. Unsupported keywords
                    do not affect the result. A passing result only covers the
                    implemented checks. Consult the{' '}
                    <a
                      className="underline"
                      href="https://json-schema.org/draft-07"
                    >
                      draft-07 specification
                    </a>{' '}
                    for the full vocabulary. Use the{' '}
                    <a className="underline" href="/tools/json-formatter">
                      JSON formatter
                    </a>{' '}
                    to inspect the document's structure.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does this validate every draft-07 schema?',
              answer:
                'No. It supports a subset of draft-07 keywords and does not validate the schema against a meta-schema. Unsupported keywords are ignored, so a passing result is not proof of full draft-07 validity.',
            },
            {
              question:
                'Is JSON syntax validation the same as schema validation?',
              answer:
                'No. Syntax validation checks whether the text is valid JSON. Schema validation checks whether the parsed values satisfy rules such as types, required fields, and numeric bounds.',
            },
          ]}
        />
      }
    />
  );
}
