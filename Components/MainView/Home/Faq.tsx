import Link from 'next/link'

const questions = [
    {
        question: 'What can I do with DevOven?',
        answer: 'DevOven is a collection of developer tools you can use in your browser. Format JSON, decode Base64, inspect a JWT, generate hashes, compare text, or convert images and PDFs. Choose a tool from the collection above, paste your input or select a file, and work with the result on the same page.',
    },
    {
        question: 'Is DevOven free? Do I need an account?',
        answer: 'Every tool is free to use. You do not need an account, a subscription, or a credit card. Open a tool and start using it.',
    },
    {
        question: 'Does my data leave my browser?',
        answer: 'Nearly all tools process your input in your browser, including JSON formatting, hashing, and image and PDF conversion. Two tools need server requests. My IP Address reads details from your request and returns them to you. The Google Maps API Scanner sends the key you enter through our server to Google to check its restrictions. Neither tool stores that data. If you send feedback, the form sends your message to the maintainer through Telegram.',
        href: '/privacy',
        linkLabel: 'Read about privacy',
    },
    {
        question: 'Do I need to install anything?',
        answer: 'No installation or browser extension is needed. DevOven runs in a modern browser on your computer, phone, or tablet. Some tools use browser APIs, so support for a particular file format or operation can vary by browser.',
    },
    {
        question: 'Can I chain several tools together?',
        answer: 'Yes. Blocks lets you build a pipeline where each operation passes its output to the next. For example, decode a Base64 string, then format the decoded JSON. Blocks includes a selection of DevOven operations, and it saves your unfinished pipeline in this browser so you can return to it after a reload.',
        href: '/blocks',
        linkLabel: 'Try Blocks',
    },
    {
        question: 'Will my input still be here when I come back?',
        answer: 'Do not rely on tool pages to save your work. Copy or download results you want to keep before leaving. DevOven stores preferences and recently used tools on your device, and Blocks saves its pipeline locally. There is no account that syncs your work across devices.',
    },
    {
        question: 'Can I run DevOven myself?',
        answer: 'Yes. DevOven is open source, and you can run a local copy from the GitHub repository. Browser-based tools work without API keys or an environment file. The repository also explains how to enable the optional MCP server to use supported operations with an AI agent.',
        href: 'https://github.com/marduc812/devoven',
        linkLabel: 'View the source and setup guide',
    },
]

export default function Faq() {
    return (
        <section id="faq" aria-labelledby="faq-heading" className="border-t border-gray-900 bg-white px-8 py-10 md:px-12 md:py-12">
            <div className="max-w-3xl">
                <h2 id="faq-heading" className="text-2xl font-black tracking-tight text-gray-900">Frequently asked questions</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">What to know before you paste, convert, or build a pipeline.</p>
                <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
                    {questions.map((item, index) => (
                        <details key={item.question} open={index === 0} className="group py-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 [&::-webkit-details-marker]:hidden">
                                <span>{item.question}</span>
                                <span aria-hidden="true" className="shrink-0 text-lg font-normal text-gray-500 group-open:hidden">+</span>
                                <span aria-hidden="true" className="hidden shrink-0 text-lg font-normal text-gray-500 group-open:inline">−</span>
                            </summary>
                            <div className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-700">
                                <p>{item.answer}</p>
                                {item.href && (
                                    <Link href={item.href} prefetch={false} className="mt-3 inline-block font-semibold text-gray-900 underline underline-offset-4 hover:decoration-2">
                                        {item.linkLabel}
                                    </Link>
                                )}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    )
}
