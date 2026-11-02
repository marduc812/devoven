import type { Metadata } from 'next';
import { StatisticsCalculator } from '@/Components/Functions/StatisticsTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/statistics-calculator', {
  title: 'Statistics calculator | Mean & standard deviation | DevOven',
  description:
    'Calculate mean, median, mode, variance, and standard deviation online. Paste numbers to see quartiles, a frequency distribution, and a box plot.',
});

export default function Page() {
  return (
    <StatisticsCalculator
      article={
        <ToolArticle
          name="Statistics calculator"
          path="/tools/statistics-calculator"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate descriptive statistics from numbers',
              body: (
                <>
                  <p>
                    Paste numbers separated by commas or line breaks to
                    calculate descriptive statistics. The results include the
                    count, sum, minimum, maximum, range, mean, median, mode,
                    variance, standard deviation, quartiles, and interquartile
                    range.
                  </p>
                  <p>
                    For the sample <code>1, 2, 2, 3, 7</code>, the sum is 15,
                    the mean is 3, the median is 2, and the mode is 2. The range
                    is <code>7 - 1 = 6</code>. Comparing the mean and median
                    helps show how a large value affects the average.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose the right calculation',
              body: (
                <>
                  <p>
                    The mean divides the sum by the count. The median is the
                    middle value after sorting. The mode is the most frequent
                    value. Standard deviation measures spread around the mean,
                    while the frequency distribution counts how often each
                    numeric value appears.
                  </p>
                  <p>
                    For character counts in text, use the{' '}
                    <a className="underline" href="/tools/char-frequency">
                      letter frequency calculator
                    </a>
                    . For phonetic name matching, use the{' '}
                    <a className="underline" href="/tools/soundex">
                      Soundex calculator
                    </a>
                    , which turns names into letter-and-digit codes. These tasks
                    use different inputs from descriptive statistics.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How do I enter data in the statistics calculator?',
              answer:
                'Paste numbers separated by commas or line breaks. The calculator updates the results as you edit the sample.',
            },
            {
              question:
                'Does this use sample or population standard deviation?',
              answer:
                'It uses population standard deviation. The variance divides the sum of squared differences from the mean by the number of values, rather than by one less than that number.',
            },
          ]}
        />
      }
    />
  );
}
