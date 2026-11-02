import type { Metadata } from 'next';
import { ColorShadesGenerator } from '@/Components/Functions/DevTools2';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/color-shades', {
  title: 'Color shade creator | Generate HEX & HSL shades | DevOven',
  description:
    'Create 10 light-to-dark color shades from a HEX color. Preview the palette, copy HEX values, and inspect HSL values for your website or design system.',
});

export default function Page() {
  return (
    <ColorShadesGenerator
      article={
        <ToolArticle
          name="Color shade creator"
          path="/tools/color-shades"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Create shades from a HEX color',
              body: (
                <>
                  <p>
                    Enter a six-digit HEX color such as <code>#3B82F6</code>, or
                    use the color picker. The shade creator generates ten
                    light-to-dark swatches. Each row shows the HEX and HSL
                    values, with a Copy button for the HEX color.
                  </p>
                  <p>
                    Use the palette to choose backgrounds, borders, hover
                    states, and text colors. The generator keeps the input hue
                    and saturation in HSL and varies lightness between 95% and
                    5%. Its 50 through 950 labels describe the scale, but the
                    generated colors are not an exact Tailwind palette.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose shades that work together',
              body: (
                <>
                  <p>
                    A lighter swatch can work as a background while a darker
                    swatch provides text or an active state. Equal changes in
                    HSL lightness do not always look equally bright to the eye,
                    so inspect the palette in the interface where you plan to
                    use it.
                  </p>
                  <p>
                    Check foreground and background pairs with the{' '}
                    <a className="underline" href="/converting/color-contrast">
                      color contrast calculator
                    </a>{' '}
                    before using them for readable text. A shade's position in
                    this palette does not establish its contrast against another
                    color. The input color may fall between generated lightness
                    steps and may not appear as an exact swatch.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How does the shade creator generate colors?',
              answer:
                'It converts the input HEX color to HSL, keeps the hue and saturation, and creates ten swatches with lightness values from 95% down to 5%.',
            },
            {
              question: 'Are these the official Tailwind CSS shades?',
              answer:
                'No. The tool uses numeric shade labels, but its HSL lightness scale does not reproduce Tailwind CSS palettes.',
            },
          ]}
        />
      }
    />
  );
}
