import type { Metadata } from 'next';
import { AspectRatioCalc } from '@/Components/Functions/AspectRatioCalcTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/aspect-ratio-calc', {
  title: 'Aspect ratio generator & calculator | 16:9, 4:3 | DevOven',
  description:
    'Generate proportional image and video dimensions from an aspect ratio. Simplify pixel sizes to 16:9, 4:3, or another ratio and compare common widths.',
});

export default function Page() {
  return (
    <AspectRatioCalc
      article={
        <ToolArticle
          name="Aspect ratio generator and calculator"
          path="/tools/aspect-ratio-calc"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Generate dimensions from an aspect ratio',
              body: (
                <>
                  <p>
                    Enter a ratio such as <code>16:9</code> or dimensions such
                    as <code>1920x1080</code>. The calculator simplifies the
                    ratio and generates equivalent pixel sizes at common widths.
                    Use those sizes to plan an image, video frame, or responsive
                    container.
                  </p>
                  <p>
                    To calculate a height yourself, multiply the target width by
                    the ratio's height and divide by its width. A 16:9 frame at
                    1280 pixels wide is <code>1280 × 9 ÷ 16 = 720</code> pixels
                    high. The results table rounds heights to whole pixels.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose a ratio for your image or video',
              body: (
                <>
                  <p>
                    A 1:1 ratio is square. A 16:9 ratio is widescreen, and 4:3
                    is a common photo and display format. Swap the numbers to
                    describe a portrait frame, such as 9:16. A ratio describes
                    the shape, so 1920x1080 and 1280x720 both simplify to 16:9.
                  </p>
                  <p>
                    This tool generates dimensions and does not resize or crop
                    an image file. In CSS, <code>aspect-ratio: 16 / 9</code>{' '}
                    describes the same proportions. Use the{' '}
                    <a className="underline" href="/converting/px-rem">
                      px to rem converter
                    </a>{' '}
                    if you also need to convert layout measurements.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How do I generate a 16:9 aspect ratio?',
              answer:
                'Enter 16:9 in the dimensions field. The table shows proportional sizes at common widths, including 1280 by 720 and 1920 by 1080 pixels.',
            },
            {
              question: 'Does the aspect ratio generator create images?',
              answer:
                'No. It calculates proportional dimensions and simplified ratios. Use an image editor to resize or crop your actual image.',
            },
          ]}
        />
      }
    />
  );
}
