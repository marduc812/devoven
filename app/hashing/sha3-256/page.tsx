import type { Metadata } from 'next';
import { SHA3256 } from '@/Components/Functions/Hashers/sha3256';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/hashing/sha3-256', {
  title: 'SHA3-256 hash generator online | 256-bit digest | DevOven',
  description:
    'Generate a SHA3-256 hash from text online. Copy a 64-character hex digest, check an abc example, and compare SHA3-256 with SHA-256 and Keccak-256.',
});

export default function Page() {
  return (
    <SHA3256
      article={
        <ToolArticle
          name="SHA3-256 hash generator"
          path="/hashing/sha3-256"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Calculate a SHA3-256 digest',
              body: (
                <>
                  <p>
                    Enter text to calculate a SHA3-256 hash locally in your
                    browser. The output contains 256 bits, or 32 bytes, written
                    as 64 hexadecimal characters. The generator uses UTF-8 text
                    input and updates the digest when you edit the message.
                  </p>
                  <p>
                    For <code>abc</code>, without a newline, the SHA3-256 digest
                    is{' '}
                    <code className="break-all">
                      3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532
                    </code>
                    . If your result differs, check letter case, spaces, and
                    line endings before comparing implementations.
                  </p>
                </>
              ),
            },
            {
              heading: 'SHA3-256, SHA-256, and Keccak-256',
              body: (
                <>
                  <p>
                    SHA3-256 and SHA-256 both produce 256-bit digests, but they
                    use different algorithms and produce different results for
                    the same message. SHA3-256 also differs from Keccak-256 in
                    its padding. The{' '}
                    <a
                      className="underline"
                      href="https://www.pycryptodome.org/src/hash/sha3_256"
                    >
                      SHA3-256 documentation
                    </a>{' '}
                    explains the relationship to Keccak.
                  </p>
                  <p>
                    If a blockchain API asks for Keccak-256, use the{' '}
                    <a className="underline" href="/hashing/keccak256">
                      Keccak-256 generator
                    </a>
                    . For a SHA-2 digest, use{' '}
                    <a className="underline" href="/hashing/sha256">
                      SHA-256
                    </a>
                    . Hashing does not encrypt the input, and there is no key
                    that reverses the digest.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Is SHA3 256 the same as SHA3-256?',
              answer:
                'Yes. SHA3 256 usually refers to SHA3-256, the SHA-3 variant with a 256-bit output. Its hexadecimal digest has 64 characters.',
            },
            {
              question: 'Can I use SHA3-256 instead of Keccak-256?',
              answer:
                'Use the exact algorithm required by your protocol. SHA3-256 and Keccak-256 use different padding and their results are not interchangeable.',
            },
          ]}
        />
      }
    />
  );
}
