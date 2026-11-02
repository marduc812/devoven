import type { Metadata } from 'next';
import { HTMLDecode } from '@/Components/Functions/Encoders';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/html-decode', {
  title: 'Decode HTML online | HTML entity decoder | DevOven',
  description:
    'Decode HTML online to turn &amp;, &lt;, and numeric entities into readable text. Paste encoded text and copy the decoded output in your browser.',
});

export default function Page() {
  return (
    <HTMLDecode
      article={
        <ToolArticle
          name="HTML entity decoder"
          path="/encoding/html-decode"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Decode HTML entities online',
              body: (
                <>
                  <p>
                    Paste HTML-encoded text to turn character references into
                    their readable characters. For example,{' '}
                    <code>{'Tom &amp; Jerry'}</code> becomes{' '}
                    <code>Tom &amp; Jerry</code>, while{' '}
                    <code>{'&lt;p&gt;Hello&lt;/p&gt;'}</code> becomes the
                    literal text <code>{'<p>Hello</p>'}</code> in the output.
                  </p>
                  <p>
                    The decoder handles named entities, decimal numeric
                    references, and hexadecimal numeric references. Examples
                    include <code>{'&quot;'}</code> for a quotation mark,{' '}
                    <code>{'&#39;'}</code> for an apostrophe, and{' '}
                    <code>{'&#x26;'}</code> for an ampersand. The conversion
                    runs in your browser.
                  </p>
                </>
              ),
            },
            {
              heading: 'Decoding, encoding, and double-encoded text',
              body: (
                <>
                  <p>
                    Decoding performs one pass. If <code>{'&amp;lt;'}</code>{' '}
                    becomes <code>{'&lt;'}</code>, the input was encoded more
                    than once. Run another pass only if that matches the text
                    you intend to recover. A line break or other literal text
                    stays part of the output.
                  </p>
                  <p>
                    Decoding entities is separate from removing HTML tags or
                    sanitizing markup. The output is text and may contain markup
                    characters. Use the{' '}
                    <a className="underline" href="/encoding/html-encode">
                      HTML encoder
                    </a>{' '}
                    for the reverse conversion when you need character
                    references.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'How do I decode HTML online?',
              answer:
                'Paste the encoded text into HTML Encoded Input. The output updates with decoded named and numeric HTML character references, ready to copy.',
            },
            {
              question: 'Does HTML decoding remove tags?',
              answer:
                'No. Entity decoding replaces character references with characters. It does not strip HTML tags or make untrusted markup safe to insert as HTML.',
            },
          ]}
        />
      }
    />
  );
}
