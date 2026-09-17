import React from 'react'

export type ArticleSection = {
    /** Rendered as an h2. Sentence case, and it should read like a question or a task. */
    heading: string;
    body: React.ReactNode;
}

export type ArticleFaq = {
    question: string;
    /** Plain text. It is both rendered and used verbatim in the FAQPage JSON-LD. */
    answer: string;
}

export type ToolArticleProps = {
    /** The tool's own name, for the SoftwareApplication entry. */
    name: string;
    /** Route, e.g. /encoding/morse-code. Used to build the absolute @id. */
    path: string;
    /** One sentence, for the SoftwareApplication entry. */
    description: string;
    /** One of Schema.org's applicationCategory values, e.g. 'DeveloperApplication'. */
    category?: string;
    sections?: ArticleSection[];
    faq?: ArticleFaq[];
}

const SITE = 'https://www.devoven.com';

/**
 * The written half of a tool page: the explanation, the reference tables and the
 * questions people actually type, plus the JSON-LD that describes the tool.
 *
 * Tools here render in about 180 words of HTML, which is nowhere near enough to
 * compete for a query like "morse code converter" against pages carrying the
 * full character chart and an explanation of how the timing works. The widget
 * answers the query; this is the part that makes the page worth ranking.
 */
export default function ToolArticle(props: ToolArticleProps) {
    const { name, path, description, category = 'DeveloperApplication', sections = [], faq = [] } = props;

    const schema: Record<string, unknown>[] = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            '@id': `${SITE}${path}#tool`,
            name,
            url: `${SITE}${path}`,
            description,
            applicationCategory: category,
            operatingSystem: 'Any',
            browserRequirements: 'Requires JavaScript',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            publisher: { '@type': 'Organization', name: 'DevOven', url: SITE },
        },
    ];

    if (faq.length > 0) {
        schema.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${SITE}${path}#faq`,
            mainEntity: faq.map(item => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
            })),
        });
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            {(sections.length > 0 || faq.length > 0) && (
                <article className="border-t border-gray-900 px-8 md:px-12 py-10">
                    <div className="max-w-3xl flex flex-col gap-10">
                        {sections.map(section => (
                            <section key={section.heading} className="flex flex-col gap-3">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">{section.heading}</h2>
                                <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-700">
                                    {section.body}
                                </div>
                            </section>
                        ))}

                        {faq.length > 0 && (
                            <section className="flex flex-col gap-4">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Common questions</h2>
                                <dl className="flex flex-col gap-4">
                                    {faq.map(item => (
                                        <div key={item.question} className="border-l-2 border-gray-300 pl-4">
                                            <dt className="text-sm font-bold text-gray-900 mb-1">{item.question}</dt>
                                            <dd className="text-sm leading-relaxed text-gray-700">{item.answer}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        )}
                    </div>
                </article>
            )}
        </>
    )
}
