import type { Metadata } from 'next';
import { Base64Encode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base64-encode', {
  title: 'Base64 encoder | Text and hex to Base64 | DevOven',
  description:
    'Encode text or hex bytes to Base64 online. Choose UTF-8, UTF-16LE, ASCII, or hex input and compare examples with standard and URL-safe Base64.',
});

export default function Page() {
  return (
    <Base64Encode
      article={
        <ToolArticle
          name="Base64 encoder"
          path="/encoding/base64-encode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Convert text or hexadecimal bytes to Base64',
              body: (
                <>
                  <p>
                    Paste your input and choose its byte encoding. UTF-8 is the
                    default for ordinary text, including accented letters and
                    emoji. UTF-16LE represents the same text with different
                    bytes, so it usually produces a different result. HEX treats
                    pairs of hexadecimal digits as bytes rather than encoding
                    the digits themselves.
                  </p>
                  <p>
                    With UTF-8, <code>Hello</code> becomes <code>SGVsbG8=</code>
                    . With HEX selected, <code>48656c6c6f</code> produces that
                    same Base64 result. Use complete pairs of hex digits because
                    this converter does not report every malformed hex input.
                  </p>
                </>
              ),
            },
            {
              heading: 'Choose standard Base64 or Base64URL',
              body: (
                <>
                  <p>
                    The output here uses standard Base64. It can contain{' '}
                    <code>+</code>, <code>/</code>, and trailing <code>=</code>{' '}
                    padding. If a protocol expects the URL-safe alphabet without
                    padding, use the{' '}
                    <a className="underline" href="/encoding/base64url-encode">
                      Base64URL encoder
                    </a>{' '}
                    instead. The alphabets are defined in{' '}
                    <a
                      className="underline"
                      href="https://www.rfc-editor.org/rfc/rfc4648"
                    >
                      RFC 4648
                    </a>
                    .
                  </p>
                  <p>
                    Base64 is reversible encoding and does not protect a
                    password or secret. Use the{' '}
                    <a className="underline" href="/encoding/base64-decode">
                      Base64 decoder
                    </a>{' '}
                    to check the result. For an entire binary file, use the{' '}
                    <a className="underline" href="/tools/base64-file">
                      Base64 file tool
                    </a>
                    .
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Is Base64 encryption?',
              answer:
                'No. Base64 represents bytes as text, and anyone can decode it without a key. It does not provide confidentiality.',
            },
            {
              question: 'Why does the same text have different Base64 results?',
              answer:
                'Base64 encodes bytes. UTF-8 and UTF-16LE produce different byte sequences for the same text, so select the encoding expected by the receiving system.',
            },
          ]}
        />
      }
    />
  );
}
