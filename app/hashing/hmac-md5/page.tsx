import type { Metadata } from 'next';
import { HmacMD5 } from '@/Components/Functions/Hashers/hmacmd5';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/hmac-md5', {
  title: 'HMAC-MD5 generator online | Message & secret key | DevOven',
  description:
    'Calculate an HMAC-MD5 from a message and secret key in your browser. Copy the 32-character hex result for legacy compatibility and compare known test values.',
});

export default function Page() {
  return (
    <HmacMD5
      article={
        <ToolArticle
          name="HMAC-MD5 generator"
          path="/hashing/hmac-md5"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate HMAC-MD5 with a secret key',
              body: (
                <>
                  <p>
                    Enter your message in Text Input and your key in the key
                    field. The generator computes HMAC-MD5 and returns a
                    32-character hexadecimal authentication code. Both fields
                    use text input, so a key written as{' '}
                    <code>736563726574</code> is treated as those characters
                    rather than as decoded hex bytes.
                  </p>
                  <p>
                    A known example uses the message{' '}
                    <code>The quick brown fox jumps over the lazy dog</code> and
                    the key <code>key</code>. The result is{' '}
                    <code className="break-all">
                      80070713463e7749b90c2dc24911e275
                    </code>
                    . Match spaces, capitalization, and any trailing newline
                    when comparing results.
                  </p>
                </>
              ),
            },
            {
              heading: 'HMAC-MD5 compatibility and alternatives',
              body: (
                <>
                  <p>
                    HMAC combines a hash function with a secret key to
                    authenticate a message. It differs from plain MD5 and from
                    manually hashing a key concatenated with a message. Use the
                    algorithm your existing protocol specifies when reproducing
                    a legacy signature.
                  </p>
                  <p>
                    <a
                      className="underline"
                      href="https://www.rfc-editor.org/rfc/rfc6151"
                    >
                      RFC 6151
                    </a>{' '}
                    advises against HMAC-MD5 for new protocol designs. For a new
                    integration, the{' '}
                    <a className="underline" href="/hashing/hmac-sha256">
                      HMAC-SHA256 generator
                    </a>{' '}
                    can help test signatures. Keep real secret keys out of
                    shared URLs, screenshots, and issue reports.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Is HMAC-MD5 the same as MD5?',
              answer:
                'No. MD5 hashes a message without a key. HMAC-MD5 uses the HMAC construction with a secret key and the MD5 hash function.',
            },
            {
              question: 'Why does my HMAC-MD5 result differ?',
              answer:
                'Check the exact message bytes, the key, and the output encoding. This tool interprets both inputs as UTF-8 text and returns hexadecimal output. Newlines and spaces affect the result.',
            },
          ]}
        />
      }
    />
  );
}
