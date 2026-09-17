import React from 'react';
import ToolArticle, { ArticleSection, ArticleFaq } from '@/Components/MainView/MainPanel/ToolArticle';

const code = 'font-mono text-xs bg-gray-50 border border-gray-200 px-1 py-0.5';
const block = 'font-mono text-xs bg-gray-50 border border-gray-200 p-3 overflow-x-auto whitespace-pre text-gray-800';

const sections: ArticleSection[] = [
    {
        heading: 'What HMAC-SHA256 actually proves',
        body: (
            <>
                <p>
                    A plain SHA-256 hash tells you a message has not changed. It does not tell you who
                    sent it, because anyone can hash anything. HMAC closes that gap by folding a shared
                    secret into the hash, so only someone holding the key can produce a tag that
                    verifies.
                </p>
                <p>
                    The construction is defined in RFC 2104 and it is deliberately not just
                    {' '}<span className={code}>SHA256(key + message)</span>. That naive form is vulnerable
                    to a length-extension attack: given a valid tag, an attacker can append data and
                    forge a new valid tag without ever seeing the key. HMAC hashes twice with two
                    derived keys, which removes the attack:
                </p>
                <div className={block}>{`HMAC(K, m) = H( (K' XOR opad) || H( (K' XOR ipad) || m ) )`}</div>
                <p>
                    K&apos; is the key padded to the hash&apos;s 64-byte block size, or hashed down
                    first if it is longer. ipad is the byte 0x36 repeated, opad is 0x5C repeated.
                </p>
            </>
        ),
    },
    {
        heading: 'Hex or Base64',
        body: (
            <>
                <p>
                    The tag is 32 raw bytes. What differs between APIs is only how those bytes are
                    written down, and picking the wrong encoding is the usual reason a signature
                    comparison fails when the key and message are both right.
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1.5">
                    <li><span className="font-bold text-gray-900">Hex</span> gives 64 characters. GitHub webhooks (<span className={code}>X-Hub-Signature-256</span>), Stripe (<span className={code}>Stripe-Signature</span>), Shopify&apos;s API and AWS Signature Version 4 all use it.</li>
                    <li><span className="font-bold text-gray-900">Base64</span> gives 44 characters ending in <span className={code}>=</span>. Shopify&apos;s webhook header, Twilio, and most JWT and OAuth 1.0a signing use it.</li>
                </ul>
                <p>
                    Use the output selector above to switch between them. The underlying tag is the
                    same either way, so if your server computes one and you have the other, you are
                    looking at the same value in two alphabets rather than at a mismatch.
                </p>
            </>
        ),
    },
    {
        heading: 'Computing the same value in your own code',
        body: (
            <>
                <p>Every mainstream runtime ships HMAC-SHA256. These all produce the hex output above.</p>
                <div className={block}>{`// Node.js
import { createHmac } from 'node:crypto';
createHmac('sha256', key).update(message).digest('hex');

// Python
import hmac, hashlib
hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()

// Go
mac := hmac.New(sha256.New, []byte(key))
mac.Write([]byte(message))
hex.EncodeToString(mac.Sum(nil))

// Shell
printf '%s' "$message" | openssl dgst -sha256 -hmac "$key" -hex`}</div>
                <p>
                    One warning that costs people hours: <span className={code}>echo</span> adds a
                    trailing newline, so <span className={code}>echo -n</span> or
                    {' '}<span className={code}>printf</span> is what you want. A tag over
                    {' '}<span className={code}>admin\n</span> will never match a tag over
                    {' '}<span className={code}>admin</span>.
                </p>
            </>
        ),
    },
    {
        heading: 'Verifying a webhook signature',
        body: (
            <>
                <p>
                    The common job. Your endpoint receives a request with a signature header, and you
                    need to decide whether to trust the body. Compute HMAC-SHA256 over the exact raw
                    body with your webhook secret as the key, and compare against the header.
                </p>
                <p>
                    Two details decide whether this works. Sign the <em>raw</em> bytes, before any JSON
                    parse and re-serialise: reordering keys or changing whitespace changes the tag.
                    And compare with a constant-time function such as
                    {' '}<span className={code}>crypto.timingSafeEqual</span> rather than
                    {' '}<span className={code}>===</span>, because a comparison that returns early on the
                    first differing byte leaks how much of a guess was correct.
                </p>
                <p>
                    Several providers put more than the body into the signed string. Stripe signs
                    {' '}<span className={code}>timestamp + &quot;.&quot; + body</span> and expects you to
                    reject old timestamps, which is what stops a captured request being replayed.
                </p>
            </>
        ),
    },
];

const faq: ArticleFaq[] = [
    {
        question: 'Is my secret key sent to a server?',
        answer: 'No. The HMAC is computed in your browser by JavaScript on this page. The key and the message never leave your device, nothing is logged, and the tool keeps working with the network disconnected. That said, a production secret pasted into any web page is a secret that has been in a browser, so for a live key prefer the openssl or Node snippet above.',
    },
    {
        question: 'What is the difference between HMAC-SHA256 and SHA-256?',
        answer: 'SHA-256 is a hash: it takes a message and returns a fingerprint, and anyone can compute it. HMAC-SHA256 takes a message and a secret key, so the result can only be produced or checked by someone holding the key. SHA-256 detects accidental corruption; HMAC-SHA256 detects tampering by someone who wants to go undetected.',
    },
    {
        question: 'How long is an HMAC-SHA256 output?',
        answer: 'Always 256 bits, or 32 bytes, however long the message and the key are. Written as hex that is 64 characters; as Base64 it is 44 characters including one padding =.',
    },
    {
        question: 'Does the key length matter?',
        answer: 'HMAC accepts a key of any length: shorter keys are padded to 64 bytes, longer ones are hashed down to 32 first. Security does depend on it though. RFC 2104 recommends at least 32 bytes of random data, and a short or guessable key can be brute-forced offline from a single captured message and tag.',
    },
    {
        question: 'Why does my signature not match the one in the header?',
        answer: 'In order of how often it happens: the wrong encoding (hex against Base64), a trailing newline added by a shell echo, signing a re-serialised JSON body instead of the raw bytes received, and a provider that signs a timestamp alongside the body rather than the body alone.',
    },
    {
        question: 'Is HMAC-SHA256 still considered secure?',
        answer: 'Yes. It is a current recommendation in NIST SP 800-107 and is used throughout TLS, JWT (as HS256), AWS SigV4 and OAuth. HMAC is also unusually robust: it survived in use even against MD5 and SHA-1 long after collisions were found in those hashes, because it does not depend on collision resistance in the way a plain signature does.',
    },
];

export const HmacSha256Article = (
    <ToolArticle
        name="HMAC-SHA256 Generator"
        path="/hashing/hmac-sha256"
        description="Generate an HMAC-SHA256 tag from a message and a secret key, in hex or Base64, entirely in your browser."
        category="SecurityApplication"
        sections={sections}
        faq={faq}
    />
);
