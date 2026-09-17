import React from 'react';
import ToolArticle, { ArticleSection, ArticleFaq } from '@/Components/MainView/MainPanel/ToolArticle';

const cell = 'border border-gray-200 px-3 py-1.5 text-left';
const code = 'font-mono text-xs bg-gray-50 border border-gray-200 px-1 py-0.5';

const sections: ArticleSection[] = [
    {
        heading: 'ISO week numbers and US week numbers are not the same',
        body: (
            <>
                <p>
                    Ask two people what week it is and you can get two different answers, because two
                    conventions are in common use and they disagree for part of most years.
                </p>
                <div className="overflow-x-auto">
                    <table className="text-sm border-collapse w-full">
                        <thead>
                            <tr>
                                <th scope="col" className={`${cell} text-[10px] font-bold uppercase tracking-widest text-gray-500`} />
                                <th scope="col" className={`${cell} text-[10px] font-bold uppercase tracking-widest text-gray-500`}>ISO 8601</th>
                                <th scope="col" className={`${cell} text-[10px] font-bold uppercase tracking-widest text-gray-500`}>US / broadcast</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row" className={`${cell} font-bold text-gray-900`}>Week starts</th>
                                <td className={`${cell} text-gray-700`}>Monday</td>
                                <td className={`${cell} text-gray-700`}>Sunday</td>
                            </tr>
                            <tr>
                                <th scope="row" className={`${cell} font-bold text-gray-900`}>Week 1 is</th>
                                <td className={`${cell} text-gray-700`}>the week holding the first Thursday</td>
                                <td className={`${cell} text-gray-700`}>the week holding 1 January</td>
                            </tr>
                            <tr>
                                <th scope="row" className={`${cell} font-bold text-gray-900`}>Weeks in a year</th>
                                <td className={`${cell} text-gray-700`}>52 or 53, never a part week</td>
                                <td className={`${cell} text-gray-700`}>up to 54, with part weeks at both ends</td>
                            </tr>
                            <tr>
                                <th scope="row" className={`${cell} font-bold text-gray-900`}>Used by</th>
                                <td className={`${cell} text-gray-700`}>Europe, most of Asia, business and logistics software</td>
                                <td className={`${cell} text-gray-700`}>US retail and broadcast scheduling</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    The calculator shows both side by side for whatever date you enter, and says
                    plainly when they disagree. If someone in a project plan says &quot;week 32&quot;
                    without saying which convention, that is worth a message rather than a guess.
                </p>
            </>
        ),
    },
    {
        heading: 'The first-Thursday rule',
        body: (
            <>
                <p>
                    ISO 8601 never splits a week across two years. Every week belongs entirely to the
                    year that holds its Thursday, which is the same as saying week 1 is the week
                    containing the first Thursday of January, and also the same as saying it is the
                    week containing 4 January.
                </p>
                <p>
                    That is why 1 January is not always in week 1. When it falls on a Friday, Saturday
                    or Sunday, its week has its Thursday in the old year, so those days carry the
                    previous year&apos;s last week number. 1 January 2027 is a Friday, so it lands in
                    ISO week 2026-W53. Going the other way, 30 December 2024 was a Monday whose
                    Thursday fell in January, so it belongs to 2025-W01.
                </p>
                <p>
                    This is the single most common source of off-by-one week bugs. A date can carry an
                    ISO week-year different from its calendar year, and the two must be kept together:
                    {' '}<span className={code}>2026-W15</span> is unambiguous, while &quot;week 15&quot;
                    on its own is not.
                </p>
            </>
        ),
    },
    {
        heading: 'Why some years have 53 weeks',
        body: (
            <>
                <p>
                    A year is 365 days, which is 52 weeks and one day over, or two days over in a leap
                    year. Those spare days accumulate, and every five or six years they add up to a
                    whole extra week. A year has 53 ISO weeks when it starts on a Thursday, or when it
                    is a leap year starting on a Wednesday.
                </p>
                <p>
                    Recent and upcoming long years: 2015, 2020, 2026, 2032, 2037. If your reporting
                    compares week 53 against the same week last year, there usually is no same week
                    last year, and that is a reconciliation problem worth knowing about in advance.
                    The calculator reports the week count for whichever ISO year your date falls in.
                </p>
            </>
        ),
    },
    {
        heading: 'What the date field accepts',
        body: (
            <>
                <p>
                    The field takes ISO 8601 (<span className={code}>2026-04-08</span>), US order
                    (<span className={code}>04/08/2026</span>), European dotted order
                    (<span className={code}>08.04.2026</span>), long form
                    (<span className={code}>8 April 2026</span>) and a Unix timestamp in seconds or
                    milliseconds. Everything is computed in UTC, so a timestamp near midnight resolves
                    to its UTC date rather than to your local one.
                </p>
                <p>
                    The whole calculation runs in your browser. No date you enter is sent anywhere, and
                    the page keeps working offline once loaded.
                </p>
            </>
        ),
    },
];

const faq: ArticleFaq[] = [
    {
        question: 'What week number is it this week?',
        answer: 'The calculator at the top of this page opens on today and shows the current week under both conventions: the ISO 8601 week number used across Europe and most business software, and the US week number that counts from the week containing 1 January. They agree for most of the year and differ around the turn of it.',
    },
    {
        question: 'How many weeks are in a year?',
        answer: '52 in most years and 53 in a few. An ISO year has 53 weeks when it begins on a Thursday, or when it is a leap year beginning on a Wednesday. 2015, 2020 and 2026 are 53-week years; the next after that is 2032.',
    },
    {
        question: 'Is 1 January always in week 1?',
        answer: 'Not under ISO 8601. If 1 January falls on a Friday, Saturday or Sunday, it belongs to the last week of the previous year, because its week has its Thursday in that year. Under the US convention 1 January is in week 1 by definition, which is exactly where the two systems part company.',
    },
    {
        question: 'How do I calculate the ISO week number myself?',
        answer: 'Take the Thursday of the week your date falls in, by moving to Monday and then adding three days. The year of that Thursday is the ISO week-year. Count the days from 1 January of that year to the Thursday, divide by 7 and add 1, and you have the week number.',
    },
    {
        question: 'What does 2026-W15 mean?',
        answer: 'It is the ISO 8601 notation for a whole week: week 15 of the ISO week-year 2026, running Monday 6 April to Sunday 12 April 2026. Adding a day digit, as in 2026-W15-3, names Wednesday of that week, since ISO numbers days 1 for Monday through 7 for Sunday.',
    },
    {
        question: 'Which countries use week numbers?',
        answer: 'They are part of everyday planning across Northern and Central Europe, particularly in Germany (Kalenderwoche), the Nordic countries and the Netherlands, where a meeting in "week 32" needs no explanation. In the US they turn up mostly in retail, broadcast and payroll calendars rather than in general conversation.',
    },
];

export const WeekNumberArticle = (
    <ToolArticle
        name="Week Number Calculator"
        path="/converting/week-number-calculator"
        description="Find the current week number, or the ISO 8601 and US week number for any date, with the week's start and end dates."
        category="BusinessApplication"
        sections={sections}
        faq={faq}
    />
);
