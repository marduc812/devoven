import React from 'react';
import ToolArticle, { ArticleSection, ArticleFaq } from '@/Components/MainView/MainPanel/ToolArticle';
import { sieveOfEratosthenes } from './logic';

const PRIMES_100 = sieveOfEratosthenes(100);
const PRIMES_1000 = sieveOfEratosthenes(1000);

const code = 'font-mono text-xs bg-gray-50 border border-gray-200 px-1 py-0.5';

const sections: ArticleSection[] = [
    {
        heading: 'What makes a number prime',
        body: (
            <>
                <p>
                    A prime is a whole number greater than 1 with exactly two divisors: 1 and itself.
                    13 is prime because nothing between 2 and 12 divides it evenly. 12 is not, because
                    2, 3, 4 and 6 all do. A number above 1 that is not prime is called composite.
                </p>
                <p>
                    That &quot;exactly two divisors&quot; wording is what settles the awkward cases.
                    1 has one divisor, so it is neither prime nor composite. 2 has two, so it is prime,
                    and it is the only even prime, because every other even number has 2 as a third
                    divisor. Negative numbers and fractions are outside the definition entirely.
                </p>
            </>
        ),
    },
    {
        heading: 'The prime numbers from 1 to 100',
        body: (
            <>
                <p>
                    There are 25 of them. Four fall in the first ten numbers and then they thin out,
                    which is the pattern that holds for the rest of the number line.
                </p>
                <p className="font-mono text-sm text-gray-900 leading-7 break-words">
                    {PRIMES_100.join(', ')}
                </p>
            </>
        ),
    },
    {
        heading: 'The prime numbers from 1 to 1000',
        body: (
            <>
                <p>
                    168 primes, so the density has already dropped from 25% in the first hundred to
                    under 17% over the first thousand. The prime number theorem puts a figure on that
                    thinning: the count of primes below n settles near n divided by the natural
                    logarithm of n, which for n = 1000 predicts 145 against the true 168.
                </p>
                <p className="font-mono text-xs text-gray-700 leading-6 break-words">
                    {PRIMES_1000.join(', ')}
                </p>
            </>
        ),
    },
    {
        heading: 'How the checker tests a number',
        body: (
            <>
                <p>
                    For numbers up to a trillion it uses trial division, stopping at the square root.
                    That stopping point is the whole trick. If n has a divisor larger than √n, the
                    matching co-divisor is smaller than √n, so it would already have been found.
                    Testing 97 means testing 2, 3, 5 and 7, not 96 candidates.
                </p>
                <p>
                    Worked through: √97 is about 9.85. 97 is odd, so 2 is out. Its digits sum to 16,
                    which 3 does not divide. It does not end in 0 or 5, so 5 is out. 97 ÷ 7 is 13
                    remainder 6. Nothing below 9.85 divides it, and the search is over. 97 is prime.
                </p>
                <p>
                    Past a trillion, trial division would take longer than anyone would wait, so the
                    checker switches to the Miller-Rabin test over arbitrary-precision integers. Below
                    3.317 × 10<sup>24</sup> a fixed set of 13 witness bases is proven to give the right
                    answer every time, so the verdict is still a proof. Above it the same test is
                    reported as <em>probably prime</em>, which is the honest answer: the chance of a
                    composite surviving all 13 bases is far below the chance of a hardware fault, but
                    it is not zero.
                </p>
            </>
        ),
    },
    {
        heading: 'What else the tool reports',
        body: (
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
                <li><span className="font-bold text-gray-900">Prime factorisation</span> — the number written as a product of primes, as in 360 = 2³ × 3² × 5. Every number above 1 has exactly one such form.</li>
                <li><span className="font-bold text-gray-900">Every divisor</span>, built from that factorisation rather than by scanning, and each one clickable to inspect in turn.</li>
                <li><span className="font-bold text-gray-900">Neighbouring primes</span>, and whether the number is half of a twin pair like 11 and 13.</li>
                <li><span className="font-bold text-gray-900">π(n)</span> — how many primes are less than or equal to the number, sieved up to five million.</li>
                <li><span className="font-bold text-gray-900">Perfect, abundant or deficient</span>, from whether the proper divisors sum to more or less than the number itself. 6 and 28 are perfect; 12 is abundant; 8 is deficient.</li>
            </ul>
        ),
    },
    {
        heading: 'Why anyone needs a prime checker',
        body: (
            <>
                <p>
                    RSA keys are a pair of large primes multiplied together. The security rests on the
                    gap between the two operations on this page: testing whether a 2048-bit number is
                    prime takes milliseconds, and factoring the product of two such primes back apart
                    is beyond any machine built so far.
                </p>
                <p>
                    Hash tables take a prime modulus so that clustered keys still spread across the
                    buckets. Cicadas emerge on 13 and 17 year cycles, which are hard for a predator
                    with a shorter cycle to synchronise with. And a good deal of school arithmetic
                    comes back to the factorisation on this page, since the greatest common divisor
                    and the lowest common multiple both read straight off it.
                </p>
            </>
        ),
    },
];

const faq: ArticleFaq[] = [
    {
        question: 'Is 1 a prime number?',
        answer: 'No. A prime has exactly two distinct divisors, and 1 has only one. It was counted as prime by some mathematicians into the early 20th century, but excluding it is what lets every number have a single prime factorisation. If 1 were prime, 12 could be written as 2 x 2 x 3, or 1 x 2 x 2 x 3, or 1 x 1 x 2 x 2 x 3, and that uniqueness would be gone.',
    },
    {
        question: 'Is 2 a prime number?',
        answer: 'Yes, and it is the only even one. Every other even number is divisible by 2 as well as by 1 and itself, which gives it at least three divisors.',
    },
    {
        question: 'Is 0 a prime number?',
        answer: 'No. Primes are defined as whole numbers greater than 1, and 0 is divisible by every non-zero number, so it fails on both counts.',
    },
    {
        question: 'What is the largest known prime number?',
        answer: 'As of 2024 it is 2^136279841 - 1, a Mersenne prime with 41,024,320 digits found by the Great Internet Mersenne Prime Search. Mersenne numbers dominate the record because the Lucas-Lehmer test checks that specific form far faster than any general method.',
    },
    {
        question: 'How large a number can this tool check?',
        answer: 'Any size. Up to a trillion it reports the full picture: factorisation, every divisor, neighbouring primes and the prime count. Above that it reports primality alone, using Miller-Rabin over arbitrary-precision integers, and says whether the result is a proof or a probable-prime verdict.',
    },
    {
        question: 'Are there infinitely many primes?',
        answer: 'Yes. Euclid proved it around 300 BC in a couple of lines: multiply any finite list of primes together and add 1, and the result is divisible by none of them, so either it is prime itself or it has a prime factor outside the list. No finite list can be complete.',
    },
    {
        question: 'What are twin primes?',
        answer: 'A pair of primes two apart, such as 11 and 13, or 41 and 43. The checker flags them when your number is half of a pair. Whether there are infinitely many is still an open problem, though in 2013 Yitang Zhang proved that infinitely many prime pairs sit within a bounded gap of each other.',
    },
];

export const PrimeArticle = (
    <ToolArticle
        name="Prime Number Checker"
        path="/tools/prime"
        description="Check whether a number is prime, factorise it, list its divisors, and count the primes below it. Numbers of any size are tested with Miller-Rabin."
        category="EducationalApplication"
        sections={sections}
        faq={faq}
    />
);
