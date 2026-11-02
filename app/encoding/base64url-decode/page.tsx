import type { Metadata } from 'next';
import { Base64UrlDecode } from '@/Components/Functions/EncodingTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base64url-decode', {
  title: 'Base64URL decoder | Decode URL-safe Base64 | DevOven',
  description:
    'Decode URL-safe Base64 to UTF-8 text online. Handle - and _ characters and omitted padding, with examples for individual token segments.',
});

export default function Page() {
  return (
    <Base64UrlDecode
      article={
        <ToolArticle
          name="Base64URL decoder"
          path="/encoding/base64url-decode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Decode a URL-safe Base64 string',
              body: (
                <>
                  <p>
                    Paste one URL-safe Base64 string to decode it as UTF-8 text.
                    This tool replaces <code>-</code> and <code>_</code> with
                    their standard Base64 equivalents and restores omitted
                    padding before decoding. For example, <code>SGVsbG8</code>{' '}
                    becomes <code>Hello</code>, and <code>Pz8_</code> becomes{' '}
                    <code>???</code>.
                  </p>
                  <p>
                    This page is intended for encoded text. For binary output or
                    a different character encoding, use the{' '}
                    <a className="underline" href="/encoding/base64-decode">
                      standard Base64 decoder
                    </a>{' '}
                    and select HEX or the expected text encoding.
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
                    <a className="underline" href="/encoding/base64url-encode">
                      Base64URL encoder
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
