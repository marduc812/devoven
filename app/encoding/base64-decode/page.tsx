import type { Metadata } from 'next';
import { Base64Decode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/base64-decode', {
  title: 'Base64 decoder | Base64 to text or hex | DevOven',
  description:
    'Decode Base64 to text or hex online. Select UTF-8, UTF-16LE, ASCII, or hex output, with examples for padding, binary data, and unreadable text.',
});

export default function Page() {
  return (
    <Base64Decode
      article={
        <ToolArticle
          name="Base64 decoder"
          path="/encoding/base64-decode"
          description={metadata.description ?? ''}
          sections={[
            {
              heading: 'Decode Base64 into readable text',
              body: (
                <>
                  <p>
                    Paste a Base64 string and choose the encoding of the
                    original text. The UTF-8 default decodes{' '}
                    <code>SGVsbG8=</code> to <code>Hello</code>. Select HEX to
                    see <code>48656c6c6f</code>, the underlying bytes. Changing
                    the output encoding changes how the bytes are interpreted.
                  </p>
                  <p>
                    Unexpected symbols can mean that the original data used a
                    different text encoding or was a binary file. An image,
                    archive, or PDF will not become readable prose after
                    decoding. Use the{' '}
                    <a className="underline" href="/tools/base64-file">
                      Base64 file tool
                    </a>{' '}
                    for file conversion.
                  </p>
                </>
              ),
            },
            {
              heading: 'Check padding and the expected alphabet',
              body: (
                <>
                  <p>
                    Standard Base64 may end in one or two <code>=</code>{' '}
                    characters. The decoder is permissive, so readable output
                    alone does not prove that the input was strictly valid
                    Base64. To check a text conversion, encode the decoded text
                    again with the same character encoding using the{' '}
                    <a className="underline" href="/encoding/base64-encode">
                      Base64 encoder
                    </a>
                    .
                  </p>
                  <p>
                    For strings that use <code>-</code> and <code>_</code> in
                    place of <code>+</code> and <code>/</code>, use the{' '}
                    <a className="underline" href="/encoding/base64url-decode">
                      Base64URL decoder
                    </a>
                    . See{' '}
                    <a
                      className="underline"
                      href="https://www.rfc-editor.org/rfc/rfc4648"
                    >
                      RFC 4648
                    </a>{' '}
                    for the two alphabets.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Can this decode Base64 images?',
              answer:
                'It can display the decoded bytes as hex, but text output is not an image preview. Use the Base64 file tool to work with binary files.',
            },
            {
              question: 'Does successful decoding prove the input is valid?',
              answer:
                'No. The decoder accepts some noncanonical inputs. Use a strict validator when a protocol requires exact Base64 syntax.',
            },
          ]}
        />
      }
    />
  );
}
