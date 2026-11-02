import type { Metadata } from 'next';
import { CharFrequencyTools } from '@/Components/Functions/CharFrequencyTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/char-frequency', {
  title: 'Letter frequency calculator & character counter | DevOven',
  description:
    'Calculate letter frequency in text with counts, percentages, and an A-Z chart. Fold case, ignore whitespace, and inspect every character in your browser.',
});

export default function Page() {
  return (
    <CharFrequencyTools
      article={
        <ToolArticle
          name="Letter frequency calculator"
          path="/tools/char-frequency"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate letter frequency in a text',
              body: (
                <>
                  <p>
                    Paste your text to see how often each character occurs. The
                    ranked frequency table includes letters, digits,
                    punctuation, and whitespace. Turn on Fold case together to
                    combine uppercase and lowercase entries. Turn on Ignore
                    whitespace to exclude spaces, tabs, and line breaks.
                  </p>
                  <p>
                    For <code>banana</code>, the counts are <code>a = 3</code>,{' '}
                    <code>n = 2</code>, and <code>b = 1</code>. Divide a
                    character's count by the total counted characters and
                    multiply by 100 to get its percentage. Here, <code>a</code>{' '}
                    accounts for 50%.
                  </p>
                </>
              ),
            },
            {
              heading: 'Read the A-Z chart and frequency table',
              body: (
                <>
                  <p>
                    The A-Z chart always combines letter case and calculates
                    percentages using only the English letters A through Z. The
                    full frequency table uses all characters left after your
                    selected filters. These percentages can differ when the text
                    contains numbers, punctuation, or letters outside A-Z.
                  </p>
                  <p>
                    Letter frequencies can help compare writing samples or
                    explore substitution ciphers. A short sample may have a very
                    different distribution from a longer text. Use the{' '}
                    <a className="underline" href="/text/word-counter">
                      word counter
                    </a>{' '}
                    when you need text length rather than individual letter
                    counts.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Are uppercase and lowercase letters counted together?',
              answer:
                'The frequency table counts them separately by default. Enable Fold case together to combine them. The A-Z chart always combines case.',
            },
            {
              question: 'Does the calculator count spaces?',
              answer:
                'Yes, unless you enable Ignore whitespace. That option also excludes tabs and line breaks from the frequency table and its total.',
            },
          ]}
        />
      }
    />
  );
}
