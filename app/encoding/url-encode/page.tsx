import type { Metadata } from 'next';
import { URLEncode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/url-encode', {
  title: 'URL encoder | Percent-encode text online | DevOven',
  description:
    'Percent-encode a URL component online. Encode query values, spaces, and Unicode text with standard, all-character, or legacy %uXXXX modes.',
});

export default function Page() {
  return (
    <URLEncode
      article={
        <ToolArticle
          name="URL encoder"
          path="/encoding/url-encode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Encode a query value without changing URL separators',
              body: (
                <>
                  <p>
                    Use standard mode for an individual query value or path
                    segment. For example, <code>tea &amp; coffee</code> becomes{' '}
                    <code>tea%20%26%20coffee</code>. Put that encoded value
                    after a query key, such as{' '}
                    <code>?q=tea%20%26%20coffee</code>. Encoding a complete URL
                    also encodes its colon and slashes, which changes how the
                    URL is interpreted.
                  </p>
                  <p>
                    Standard mode follows{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"
                    >
                      encodeURIComponent
                    </a>
                    . Spaces become <code>%20</code>. A literal plus becomes{' '}
                    <code>%2B</code>. Some form encoders use <code>+</code> for
                    spaces instead, so check the format your receiver expects.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose a percent-encoding mode',
              body: (
                <>
                  <p>
                    Standard mode leaves letters, digits, and some punctuation
                    unchanged. All Characters encodes those characters too, so{' '}
                    <code>a.b</code> becomes <code>%61%2E%62</code>. Both modes
                    encode non-ASCII text as UTF-8 bytes. Encoding an existing
                    percent sign produces <code>%25</code>, so repeated encoding
                    changes the result.
                  </p>
                  <p>
                    The{' '}
                    <a
                      className="underline"
                      href="/encoding/unicode-url-encode"
                    >
                      legacy Unicode encoder
                    </a>{' '}
                    uses <code>%uXXXX</code> UTF-16 code units. Use it only when
                    a receiving system requires that format. Use the{' '}
                    <a className="underline" href="/encoding/url-decode">
                      URL decoder
                    </a>{' '}
                    to reverse a single encoding pass, or the{' '}
                    <a className="underline" href="/network/url-builder">
                      URL builder
                    </a>{' '}
                    to assemble a URL.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Should I encode an entire URL?',
              answer:
                'Usually you should encode individual values or path segments. Encoding the whole URL also replaces its structural separators, including the colon and slashes.',
            },
            {
              question: 'Does this encoder turn spaces into plus signs?',
              answer:
                'No. Standard mode turns spaces into %20 and a literal plus into %2B. Form URL encoding can use plus signs for spaces instead.',
            },
          ]}
        />
      }
    />
  );
}
