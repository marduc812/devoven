import type { Metadata } from 'next';
import { DateDiffCalculator } from '@/Components/Functions/DateDiffTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/date-diff', {
  title: 'Date difference calculator | Days between dates | DevOven',
  description:
    'Calculate the days between two dates, plus weeks, hours, and milliseconds. Enter YYYY-MM-DD dates and compare elapsed time in your browser.',
});

export default function Page() {
  return (
    <DateDiffCalculator
      article={
        <ToolArticle
          name="Date difference calculator"
          path="/tools/date-diff"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate the difference between two dates',
              body: (
                <>
                  <p>
                    Enter two dates on separate lines in <code>YYYY-MM-DD</code>{' '}
                    format. The calculator shows the total days, complete weeks
                    and remaining days, hours, and milliseconds. It also reports
                    which date comes first and gives an approximate breakdown in
                    years and months.
                  </p>
                  <p>
                    For example, <code>2026-11-02</code> and{' '}
                    <code>2026-11-09</code> are 7 days apart, or 1 week.
                    Identical dates give a difference of zero. The result
                    measures elapsed time, so it does not count both endpoint
                    dates as full days.
                  </p>
                  <p>
                    Use the{' '}
                    <a className="underline" href="/tools/calendar-week">
                      business days calculator
                    </a>{' '}
                    when you want to exclude Saturdays and Sundays. This date
                    difference calculator includes weekends.
                  </p>
                </>
              ),
            },
            {
              heading: 'محاسبه بین دو تاریخ',
              body: (
                <>
                  <div
                    lang="fa"
                    dir="rtl"
                    className="text-right flex flex-col gap-3"
                  >
                    <p>
                      برای محاسبه فاصله بین دو تاریخ، هر تاریخ را در یک خط
                      جداگانه وارد کنید. از تاریخ میلادی با قالب{' '}
                      <bdi dir="ltr">YYYY-MM-DD</bdi> و ارقام انگلیسی استفاده
                      کنید. برای مثال، فاصله بین <bdi dir="ltr">2026-11-02</bdi>{' '}
                      و <bdi dir="ltr">2026-11-09</bdi> برابر با ۷ روز است.
                    </p>
                    <p>
                      این ابزار تاریخ شمسی را تبدیل نمی‌کند. نتیجه شامل تعداد
                      روزها، هفته‌ها و ساعت‌ها است. شنبه و یکشنبه نیز در تعداد
                      کل روزها حساب می‌شوند.
                    </p>
                  </div>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does this calculator count both dates?',
              answer:
                'It measures the elapsed difference. Two identical dates give zero days, and consecutive dates give one day. It does not add an extra day to include both endpoints.',
            },
            {
              question: 'Can I enter Persian calendar dates?',
              answer:
                'No. Use Gregorian dates in YYYY-MM-DD format with English digits. The calculator does not convert Solar Hijri dates.',
            },
          ]}
        />
      }
    />
  );
}
