import type { Metadata } from 'next';
import { SoundexConverter } from '@/Components/Functions/SoundexTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/soundex', {
  title: 'Soundex calculator online | Name matching codes | DevOven',
  description:
    'Calculate Soundex codes for names online. Compare Robert and Rupert, process one name per line, and inspect the steps behind each four-character code.',
});

export default function Page() {
  return (
    <SoundexConverter
      article={
        <ToolArticle
          name="Soundex calculator"
          path="/tools/soundex"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate a Soundex code for a name',
              body: (
                <>
                  <p>
                    Enter one name per line to calculate its Soundex code. The
                    result keeps the first letter and adds three digits, with
                    zeros as padding when needed. Select a name to inspect how
                    the tool processes each letter.
                  </p>
                  <p>
                    For example, <code>Robert</code> and <code>Rupert</code>{' '}
                    both produce <code>R163</code>. Soundex groups certain
                    consonants together so names with related spellings can
                    share a code. The results also group names that produce the
                    same code.
                  </p>
                </>
              ),
            },
            {
              heading: 'Use Soundex for name matching',
              body: (
                <>
                  <p>
                    Soundex can help find candidate matches in name lists or
                    genealogy records. A matching code does not prove two names
                    identify the same person, and similar-sounding names do not
                    always share a code. Review the names and any other
                    information before accepting a match.
                  </p>
                  <p>
                    The calculator works with Latin letters A through Z. It is
                    separate from numerical{' '}
                    <a
                      className="underline"
                      href="/tools/statistics-calculator"
                    >
                      descriptive statistics
                    </a>
                    . To compare other phonetic encodings, use{' '}
                    <a className="underline" href="/text/soundex">
                      Soundex and Metaphone codes
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'What is the Soundex code for Robert?',
              answer:
                'Robert has the Soundex code R163. Rupert also produces R163, so the calculator groups them as a potential phonetic match.',
            },
            {
              question: 'Can I calculate multiple Soundex codes at once?',
              answer:
                'Yes. Enter one name per line. The calculator shows each code and identifies names that share a code.',
            },
          ]}
        />
      }
    />
  );
}
