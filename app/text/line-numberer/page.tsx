import type { Metadata } from 'next';
import { LineNumberer } from '@/Components/Functions/TextTools2';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/line-numberer', {
  title: 'Line numberer online | Add or remove line numbers | DevOven',
  description:
    'Number text lines online with a custom starting number. Add sequential line numbers to lists or code snippets, or remove existing number prefixes.',
});

export default function Page() {
  return (
    <LineNumberer
      article={
        <ToolArticle
          name="Line numberer"
          path="/text/line-numberer"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Add sequential line numbers to text',
              body: (
                <>
                  <p>
                    Paste your text and choose Add Numbers. The numberer puts a
                    number and a period before each line. Set Start from to
                    continue an existing list, such as starting the next section
                    at 25. Copy the output into a document, issue, or message
                    when you need stable line references.
                  </p>
                  <p>
                    For input with <code>apple</code> on the first line and{' '}
                    <code>banana</code> on the second, the default output is{' '}
                    <code>1. apple</code> followed by <code>2. banana</code>.
                    The tool preserves line order and also numbers blank lines
                    within the text.
                  </p>
                </>
              ),
            },
            {
              heading: 'Remove line numbers from a pasted list',
              body: (
                <>
                  <p>
                    Choose Remove Numbers to strip leading numeric prefixes
                    followed by a period, closing parenthesis, colon, or hyphen.
                    For example, <code>12. apple</code> becomes{' '}
                    <code>apple</code>. It removes matching prefixes at the
                    start of each line, so review lists whose original content
                    begins with a number.
                  </p>
                  <p>
                    Numbering follows actual line breaks, not the visual
                    wrapping of long lines in the text area. If you need an
                    alphabetical list, use{' '}
                    <a className="underline" href="/text/sort-lines">
                      sort lines
                    </a>{' '}
                    before adding numbers.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Can I choose the first line number?',
              answer:
                'Yes. Select Add Numbers and change Start from to the positive number you want. Each following line increases the number by one.',
            },
            {
              question: 'Does the line numberer change my line order?',
              answer:
                'No. It adds or removes prefixes while preserving the order of the lines. Visual wrapping does not create additional numbered lines.',
            },
          ]}
        />
      }
    />
  );
}
