import type { Metadata } from 'next';
import { CssValueConverters } from '@/Components/Functions/CssValueConverters';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/converting/px-rem', {
  title: 'Px to rem converter | 12px = 0.75rem | DevOven',
  description:
    '12px in rem is 0.75rem at a 16px root font size. Convert px to rem or rem to px, change the base size, and batch convert values in your browser.',
});

export default function Page() {
  return (
    <CssValueConverters
      article={
        <ToolArticle
          name="Pixel to rem converter"
          path="/converting/px-rem"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'What is 12px in rem?',
              body: (
                <>
                  <p>
                    12px equals 0.75rem when the root font size is 16px. Divide
                    pixels by the root font size to convert to rem. The
                    calculation is <code>12 ÷ 16 = 0.75</code>. If the root font
                    size is 20px, the same 12px equals 0.6rem.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <caption className="text-left mb-2">
                        Common conversions at a 16px root font size
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" className="p-2 border">
                            Pixels
                          </th>
                          <th scope="col" className="p-2 border">
                            Rem
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [8, 0.5],
                          [12, 0.75],
                          [14, 0.875],
                          [16, 1],
                          [18, 1.125],
                          [24, 1.5],
                          [32, 2],
                        ].map(([px, rem]) => (
                          <tr key={px}>
                            <td className="p-2 border">{px}px</td>
                            <td className="p-2 border">{rem}rem</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ),
            },
            {
              heading: 'Convert CSS values using your root font size',
              body: (
                <>
                  <p>
                    Enter one value per line, with or without the unit suffix.
                    Set Base to the computed font size of your document's root{' '}
                    <code>html</code> element. Choose rem to px for the reverse
                    conversion, which multiplies the rem value by the base size.
                  </p>
                  <p>
                    Rem units refer to the root font size. Em units usually
                    refer to the element's own font size, with different rules
                    for the font-size property. The{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/CSS/length"
                    >
                      CSS length reference
                    </a>{' '}
                    explains these units. For proportional image dimensions, use
                    the{' '}
                    <a className="underline" href="/tools/aspect-ratio-calc">
                      aspect ratio calculator
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How much is 12px in rem?',
              answer:
                '12px is 0.75rem at a root font size of 16px. Divide 12 by your actual root font size if it differs from 16px.',
            },
            {
              question: 'Is 1rem always 16px?',
              answer:
                'No. 1rem equals the computed font size of the root html element. Enter that size in Base to get the right conversion for your page.',
            },
          ]}
        />
      }
    />
  );
}
