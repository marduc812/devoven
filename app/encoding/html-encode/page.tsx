import type { Metadata } from 'next';
import { HTMLEncode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/html-encode', {
  title: 'HTML entity encoder | Escape HTML characters | DevOven',
  description:
    'Escape ampersands, angle brackets, and quotes as HTML entities online. Convert text to HTML character references and check before-and-after examples.',
});

export default function Page() {
  return (
    <HTMLEncode
      article={
        <ToolArticle
          name="HTML entity encoder"
          path="/encoding/html-encode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Escape text for display in HTML',
              body: (
                <>
                  <p>
                    Paste the text you want to display literally. This encoder
                    replaces five characters. An ampersand becomes{' '}
                    <code>&amp;amp;</code>, less-than becomes{' '}
                    <code>&amp;lt;</code>, greater-than becomes{' '}
                    <code>&amp;gt;</code>, a double quote becomes{' '}
                    <code>&amp;quot;</code>, and an apostrophe becomes{' '}
                    <code>&amp;#039;</code>.
                  </p>
                  <p>
                    For example, <code>{'<b>Tom & Jerry</b>'}</code> becomes{' '}
                    <code>{'&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;'}</code>. When
                    that encoded string appears in an HTML text node, the
                    browser displays the tag characters as text. See the{' '}
                    <a
                      className="underline"
                      href="https://html.spec.whatwg.org/multipage/named-characters.html"
                    >
                      HTML character reference list
                    </a>
                    .
                  </p>
                </>
              ),
            },
            {
              heading: 'Encode the original text once',
              body: (
                <>
                  <p>
                    Existing entity references contain an ampersand, so encoding{' '}
                    <code>&amp;lt;</code> produces <code>&amp;amp;lt;</code>.
                    That is expected when the original input is already encoded.
                    Use the{' '}
                    <a className="underline" href="/encoding/html-decode">
                      HTML entity decoder
                    </a>{' '}
                    when you need to restore readable characters instead.
                  </p>
                  <p>
                    This tool escapes text. It does not sanitize a document or
                    provide context-aware escaping for JavaScript, CSS, or URL
                    values. For percent escapes in a URL component, use the{' '}
                    <a className="underline" href="/encoding/url-encode">
                      URL encoder
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Does this encode every Unicode character?',
              answer:
                'No. It replaces ampersands, angle brackets, double quotes, and apostrophes. Other text, including accented characters and emoji, stays unchanged.',
            },
            {
              question: 'Why does &lt; become &amp;lt;?',
              answer:
                'The encoder escapes the ampersand in the existing reference. Encode original text once to avoid an extra layer of entity encoding.',
            },
          ]}
        />
      }
    />
  );
}
