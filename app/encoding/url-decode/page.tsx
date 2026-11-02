import type { Metadata } from 'next';
import { URLDecode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/url-decode', {
  title: 'URL decoder | Decode percent-encoded text | DevOven',
  description:
    'Decode percent-encoded URL components online. Convert %20 spaces and UTF-8 escapes to text, with support for legacy %uXXXX input.',
});

export default function Page() {
  return (
    <URLDecode
      article={
        <ToolArticle
          name="URL decoder"
          path="/encoding/url-decode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Read a percent-encoded URL component',
              body: (
                <>
                  <p>
                    Paste an encoded query value or path segment to see its
                    text. The input <code>tea%20%26%20coffee</code> becomes{' '}
                    <code>tea &amp; coffee</code>. The converter also decodes
                    UTF-8 byte sequences, so <code>caf%C3%A9</code> becomes{' '}
                    <code>café</code>.
                  </p>
                  <p>
                    Decoding a whole URL can turn escaped characters into
                    separators. For example, an encoded ampersand inside a value
                    becomes <code>&amp;</code>. Inspect the result as text
                    before using it as a new URL. The{' '}
                    <a className="underline" href="/network/url-parser">
                      URL parser
                    </a>{' '}
                    helps inspect a URL's individual components.
                  </p>
                </>
              ),
            },
            {
              heading: 'Understand plus signs and repeated encoding',
              body: (
                <>
                  <p>
                    This decoder leaves <code>+</code> unchanged. It does not
                    apply the plus-to-space rule used by HTML form query
                    encoding. The input <code>a+b%20c</code> becomes{' '}
                    <code>a+b c</code>. A single decoding pass changes{' '}
                    <code>%2520</code> to <code>%20</code>, not a space.
                  </p>
                  <p>
                    Malformed percent escapes or invalid UTF-8 can produce an
                    invalid-input message. Legacy <code>%uXXXX</code> input is
                    also supported, but it is a separate format from UTF-8
                    percent encoding. Use the{' '}
                    <a className="underline" href="/encoding/url-encode">
                      URL encoder
                    </a>{' '}
                    for the reverse operation. Standard decoding follows{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent"
                    >
                      decodeURIComponent
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Why does a plus sign stay a plus?',
              answer:
                'This tool decodes percent escapes. It does not replace plus signs with spaces as application/x-www-form-urlencoded decoding does.',
            },
            {
              question: 'Why is %2520 still encoded after decoding?',
              answer:
                'The original percent sign was encoded as %25. One decoding pass produces %20. A second pass would turn that into a space, but only decode again if the source format requires it.',
            },
          ]}
        />
      }
    />
  );
}
