import type { Metadata } from 'next';
import { RIPEMD160 } from '@/Components/Functions/Hashers/ripemd160';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/ripemd160', {
  title: 'RIPEMD160 hash generator online | RIPEMD-160 | DevOven',
  description:
    'Generate a RIPEMD160 hash from text online. Get a 40-character hexadecimal digest, check a known example, and understand how RIPEMD-160 differs from HASH160.',
});

export default function Page() {
  return (
    <RIPEMD160
      article={
        <ToolArticle
          name="RIPEMD160 hash generator"
          path="/hashing/ripemd160"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Generate and check a RIPEMD160 hash',
              body: (
                <>
                  <p>
                    Enter text to calculate its RIPEMD-160 digest in your
                    browser. RIPEMD160 produces 160 bits of output, shown as 40
                    hexadecimal characters. The same text always produces the
                    same digest, while a change in case, spacing, or line
                    endings changes the input.
                  </p>
                  <p>
                    For the exact text <code>abc</code>, with no trailing
                    newline, the digest is{' '}
                    <code className="break-all">
                      8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
                    </code>
                    . This is a useful reference when checking another
                    implementation. The tool treats your input as text, so
                    typing <code>616263</code> hashes those six characters
                    rather than decoding them as hexadecimal bytes.
                  </p>
                </>
              ),
            },
            {
              heading: 'RIPEMD160 and Bitcoin HASH160',
              body: (
                <>
                  <p>
                    Bitcoin's HASH160 operation applies SHA-256 to bytes and
                    then applies RIPEMD-160 to the resulting digest bytes. A
                    direct RIPEMD160 hash of text is a different operation.
                    Pasting a hexadecimal SHA-256 digest here hashes its textual
                    representation, which does not reproduce HASH160.
                  </p>
                  <p>
                    Use the{' '}
                    <a className="underline" href="/hashing/sha256">
                      SHA-256 generator
                    </a>{' '}
                    for a plain SHA-256 text digest or the{' '}
                    <a className="underline" href="/hashing/sha3-256">
                      SHA3-256 generator
                    </a>{' '}
                    for that separate algorithm. A hash is one-way and has no
                    decode operation.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How long is a RIPEMD160 hash?',
              answer:
                'RIPEMD-160 produces a 160-bit digest. In hexadecimal, that is 40 characters, regardless of the length of the input.',
            },
            {
              question: 'Is RIPEMD160 the same as HASH160?',
              answer:
                'No. HASH160 applies SHA-256 first, then RIPEMD-160 to the binary digest. This tool directly hashes the UTF-8 text you enter.',
            },
          ]}
        />
      }
    />
  );
}
