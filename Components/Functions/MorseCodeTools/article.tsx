import React from 'react';
import ToolArticle, { ArticleSection, ArticleFaq } from '@/Components/MainView/MainPanel/ToolArticle';
import { MORSE, MORSE_GROUPS, PROSIGNS } from './logic';

const cell = 'border border-gray-200 px-3 py-1.5';

function Chart({ chars, caption }: { chars: string[]; caption: string }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{caption}</p>
            <div className="overflow-x-auto">
                <table className="text-sm border-collapse">
                    <tbody>
                        {Array.from({ length: Math.ceil(chars.length / 6) }, (_, row) => (
                            <tr key={row}>
                                {chars.slice(row * 6, row * 6 + 6).map(ch => (
                                    <React.Fragment key={ch}>
                                        <th scope="row" className={`${cell} font-bold text-gray-900 text-left`}>{ch}</th>
                                        <td className={`${cell} font-mono text-gray-700 whitespace-nowrap`}>{MORSE[ch]}</td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const sections: ArticleSection[] = [
    {
        heading: 'The full Morse code chart',
        body: (
            <>
                <p>
                    Every character this converter handles, with the code it sends. Letters and digits
                    are the international standard set from ITU-R M.1677-1. The accented letters are
                    additions used across continental Europe rather than part of that standard.
                </p>
                <div className="flex flex-col gap-5 pt-1">
                    <Chart chars={MORSE_GROUPS.letters} caption="Letters" />
                    <Chart chars={MORSE_GROUPS.digits} caption="Digits" />
                    <Chart chars={MORSE_GROUPS.punctuation} caption="Punctuation and symbols" />
                    <Chart chars={MORSE_GROUPS.accented} caption="Accented letters" />
                </div>
            </>
        ),
    },
    {
        heading: 'How the timing works',
        body: (
            <>
                <p>
                    Morse is not really dots and dashes. It is one tone switched on and off, and every
                    length in it is a multiple of a single base unit. A dot is one unit of tone. A dash
                    is three. The silence inside a letter is one unit, between letters three, and
                    between words seven.
                </p>
                <p>
                    Speed is quoted in words per minute against the word PARIS, which is exactly 50
                    units long including its trailing word gap. That fixes the arithmetic: a unit lasts
                    1200/WPM milliseconds, so 20 WPM gives a 60 ms dot and a 180 ms dash. The Play
                    button above uses those exact figures, which is why a message sounds right rather
                    than just sounding like beeping.
                </p>
                <p>
                    Get the gaps wrong and you send a different message. <code className="font-mono text-xs bg-gray-50 border border-gray-200 px-1 py-0.5">...---...</code> sent
                    as one unbroken run is the distress signal SOS. Sent with proper three-unit letter
                    gaps it is the three separate letters S, O and S, which is not a distress call.
                </p>
            </>
        ),
    },
    {
        heading: 'Prosigns',
        body: (
            <>
                <p>
                    Procedural signals are run together with no letter gap, so they act as single
                    characters rather than as the letters they are written from.
                </p>
                <div className="overflow-x-auto">
                    <table className="text-sm border-collapse w-full">
                        <thead>
                            <tr>
                                <th scope="col" className={`${cell} text-left text-[10px] font-bold uppercase tracking-widest text-gray-500`}>Signal</th>
                                <th scope="col" className={`${cell} text-left text-[10px] font-bold uppercase tracking-widest text-gray-500`}>Code</th>
                                <th scope="col" className={`${cell} text-left text-[10px] font-bold uppercase tracking-widest text-gray-500`}>Meaning</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PROSIGNS.map(sign => (
                                <tr key={sign.name}>
                                    <th scope="row" className={`${cell} font-bold text-gray-900 text-left`}>{sign.name}</th>
                                    <td className={`${cell} font-mono text-gray-700 whitespace-nowrap`}>{sign.code}</td>
                                    <td className={`${cell} text-gray-700`}>{sign.meaning}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        ),
    },
    {
        heading: 'Reading the output format',
        body: (
            <>
                <p>
                    Text to Morse writes one space between letters and a slash between words, which is
                    the usual plain-text convention: <code className="font-mono text-xs bg-gray-50 border border-gray-200 px-1 py-0.5">.... .. / - .... . .-. .</code> is
                    HI THERE.
                </p>
                <p>
                    Morse to text is looser about what it accepts, because pasted Morse rarely follows
                    one convention. Words may be divided by a slash, a vertical bar, or three or more
                    spaces. Dots may be written as periods or middle dots, dashes as hyphens,
                    underscores or en dashes. Anything it cannot match comes back as a question mark,
                    which usually means a missing letter gap rather than a wrong character.
                </p>
            </>
        ),
    },
];

const faq: ArticleFaq[] = [
    {
        question: 'What is SOS in Morse code?',
        answer: 'SOS is ...---... — three dots, three dashes, three dots, sent as one unbroken signal with no gaps between the groups. It was chosen in 1906 because that rhythm is unmistakable, not because the letters stand for anything. "Save Our Ship" and "Save Our Souls" were both invented afterwards.',
    },
    {
        question: 'Does Morse code have lower case letters?',
        answer: 'No. Morse has one code per letter and no way to mark case, so this converter upper-cases everything before encoding. Decoded text comes back in capitals for the same reason.',
    },
    {
        question: 'Why does my decoded text contain question marks?',
        answer: 'A question mark means a group of dots and dashes matched no character. The usual cause is a missing gap: two letters run together form a sequence that is not in the chart. Check that letters are separated by exactly one space and words by a slash.',
    },
    {
        question: 'How fast is Morse code usually sent?',
        answer: 'Amateur radio operators commonly work between 15 and 25 words per minute. Around 5 WPM is a comfortable learning speed, licence tests historically sat near 12 WPM, and experienced operators copy 40 WPM and above by ear.',
    },
    {
        question: 'Is the Morse code conversion done on my device?',
        answer: 'Yes. The converter, the audio and the timing all run in your browser as JavaScript. Nothing you type is uploaded, and the tool works offline once the page has loaded.',
    },
    {
        question: 'What is the difference between international and American Morse code?',
        answer: 'International Morse, the code on this page, uses only two symbol lengths and is the standard everywhere today. American (or railroad) Morse, used on 19th-century US landlines, also had internal spaces inside some letters and a longer dash, so the two are not interchangeable.',
    },
];

export const MorseArticle = (
    <ToolArticle
        name="Morse Code Converter"
        path="/encoding/morse-code"
        description="Convert text to Morse code and Morse code back to text, play it as audio at any speed, and read the full character chart."
        category="UtilitiesApplication"
        sections={sections}
        faq={faq}
    />
);
