import type { Metadata } from 'next';
import { CalendarWeekCalculator } from '@/Components/Functions/CalendarWeekTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/calendar-week', {
  title: 'Business days calculator | Work days to weeks | DevOven',
  description:
    'Count calendar work days between dates, excluding weekends. Convert business days to 5-day work weeks and see ISO week numbers. Holidays are included.',
});

export default function Page() {
  return (
    <CalendarWeekCalculator
      article={
        <ToolArticle
          name="Business days and work weeks calculator"
          path="/tools/calendar-week"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Count calendar work days between two dates',
              body: (
                <>
                  <p>
                    Enter a date and a second date to count business days,
                    calendar days, and weekend days. Business days are Monday
                    through Friday. The count includes the earlier date and
                    excludes the later date. Public holidays are included when
                    they fall on weekdays.
                  </p>
                  <p>
                    For Monday <code>2026-11-02</code> through Monday{' '}
                    <code>2026-11-09</code>, the result is 5 business days and 7
                    calendar days. The selected date also shows its ISO week,
                    quarter, day of year, and the dates of its Monday-to-Sunday
                    week.
                  </p>
                </>
              ),
            },
            {
              heading: 'Convert business days to weeks',
              body: (
                <>
                  <p>
                    Divide business days by 5 to express them as standard work
                    weeks. Ten business days equal 2 work weeks. Twelve business
                    days equal 2 work weeks and 2 work days. This describes an
                    amount of working time, not an exact delivery date.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <caption className="text-left mb-2">
                        Business days to weeks at 5 work days per week
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="p-2 border">
                            Business days
                          </th>
                          <th scope="col" className="p-2 border">
                            Work weeks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [5, '1 week'],
                          [10, '2 weeks'],
                          [15, '3 weeks'],
                          [20, '4 weeks'],
                          [30, '6 weeks'],
                        ].map(([days, weeks]) => (
                          <tr key={days}>
                            <td className="p-2 border">{days}</td>
                            <td className="p-2 border">{weeks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    For elapsed time including weekends, use the{' '}
                    <a className="underline" href="/tools/date-diff">
                      date difference calculator
                    </a>
                    . For a dedicated ISO week lookup, use the{' '}
                    <a
                      className="underline"
                      href="/converting/week-number-calculator"
                    >
                      week number calculator
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How many weeks are 10 business days?',
              answer:
                'Ten business days equal two 5-day work weeks. The actual date span depends on the start date, holidays, and the work schedule.',
            },
            {
              question: 'Are public holidays excluded?',
              answer:
                'No. The calculator excludes Saturdays and Sundays only. It includes weekday holidays and assumes a Monday-to-Friday work week.',
            },
          ]}
        />
      }
    />
  );
}
