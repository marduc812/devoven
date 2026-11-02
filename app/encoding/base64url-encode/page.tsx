import type { Metadata } from 'next';
import { Base64UrlEncode } from '@/Components/Functions/EncodingTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base64url-encode', {
  title: 'Base64URL encoder | URL-safe Base64 online | DevOven',
  description:
    'Encode UTF-8 text to URL-safe Base64 without padding. Convert + and / to - and _, with examples for query values and token segments.',
});

export default function Page() {
  return (
    <Base64UrlEncode
      article={
        <ToolArticle
          name="Base64URL encoder"
          path="/encoding/base64url-encode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Encode text with the URL-safe alphabet',
              body: (
                <>
                  <p>
                    Paste text to encode its UTF-8 bytes with the URL-safe
                    Base64 alphabet. This encoder uses <code>-</code> instead of{' '}
                    <code>+</code> and <code>_</code> instead of <code>/</code>.
                    It removes trailing <code>=</code> padding. For example,{' '}
                    <code>Hello</code> becomes <code>SGVsbG8</code>.
                  </p>
                  <p>
                    The text <code>???</code> becomes <code>Pz8_</code>. The
                    equivalent standard Base64 is <code>Pz8/</code>. Use the{' '}
                    <a className="underline" href="/encoding/base64-encode">
                      standard Base64 encoder
                    </a>{' '}
                    when the receiving format expects that alphabet and padding.
                  </p>
                </>
              ),
            },
            {
              heading: 'Work with encoded token segments',
              body: (
                <>
                  <p>
                    JWT headers and payloads use Base64URL, but a complete token
                    also includes dots and a signature. Process one segment at a
                    time here. Changing or reading a segment does not verify a
                    signature or establish that a token is trustworthy.
                  </p>
                  <p>
                    See{' '}
                    <a
                      className="underline"
                      href="https://www.rfc-editor.org/rfc/rfc4648#section-5"
                    >
                      RFC 4648 section 5
                    </a>{' '}
                    for the URL-safe alphabet. Use the{' '}
                    <a className="underline" href="/encoding/base64url-decode">
                      Base64URL decoder
                    </a>{' '}
                    for the reverse conversion.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How is Base64URL different from Base64?',
              answer:
                'Base64URL replaces + with - and / with _. This encoder also omits trailing = padding, and the decoder restores missing padding.',
            },
            {
              question: 'Can I decode an entire JWT here?',
              answer:
                'Paste one encoded segment at a time. Decoding the header or payload does not verify the signature or validate the token.',
            },
          ]}
        />
      }
    />
  );
}
