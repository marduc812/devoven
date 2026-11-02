import type { Metadata } from 'next';
import { URLEncode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/unicode-url-encode', {
  title: 'Unicode URL encoder | Legacy %uXXXX encoding | DevOven',
  description:
    'Convert text to legacy %uXXXX escape sequences online. Inspect UTF-16 code units and switch to standard UTF-8 percent encoding when needed.',
});

export default function Page() {
  return (
    <URLEncode
      defaultMode="unicode"
      article={
        <ToolArticle
          name="Unicode URL encoder"
          path="/encoding/unicode-url-encode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Generate legacy %uXXXX escape sequences',
              body: (
                <>
                  <p>
                    This page starts in Unicode mode. Each UTF-16 code unit
                    becomes a <code>%uXXXX</code> sequence, including ordinary
                    letters and punctuation. For example, <code>a.b</code>{' '}
                    becomes <code>%u0061%u002E%u0062</code>, and <code>é</code>{' '}
                    becomes <code>%u00E9</code>.
                  </p>
                  <p>
                    Characters outside the basic multilingual plane use two
                    UTF-16 code units. The emoji <code>😀</code> becomes{' '}
                    <code>%uD83D%uDE00</code>. This output is useful when
                    reproducing a legacy system's input format.
                  </p>
                </>
              ),
            },
            {
              heading: 'Use UTF-8 percent encoding for standard URL components',
              body: (
                <>
                  <p>
                    The legacy <code>%uXXXX</code> notation is not standard URL
                    percent encoding. For modern query values and path segments,
                    select Standard mode or open the{' '}
                    <a className="underline" href="/encoding/url-encode">
                      URL encoder
                    </a>
                    . In standard mode, <code>é</code> becomes{' '}
                    <code>%C3%A9</code>, its UTF-8 bytes.
                  </p>
                  <p>
                    The{' '}
                    <a className="underline" href="/encoding/url-decode">
                      URL decoder
                    </a>{' '}
                    accepts both formats. Compare the output expected by your
                    receiving application before choosing a mode. The browser's
                    standard{' '}
                    <a
                      className="underline"
                      href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"
                    >
                      encodeURIComponent function
                    </a>{' '}
                    uses percent-encoded UTF-8, rather than <code>%u</code>{' '}
                    sequences.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Is %uXXXX standard URL encoding?',
              answer:
                'No. It is a legacy notation for UTF-16 code units. Standard URL component encoding represents UTF-8 bytes as %XX sequences.',
            },
            {
              question: 'Why does an emoji produce two %u sequences?',
              answer:
                'Many emoji require a UTF-16 surrogate pair. Unicode mode emits one %uXXXX sequence for each code unit.',
            },
          ]}
        />
      }
    />
  );
}
