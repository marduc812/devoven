import { PalindromeChecker } from '@/Components/Functions/PalindromeTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/palindrome', {
  title: 'Palindrome Checker — Check Words & Phrases | DevOven',
  description: 'Check if a word or phrase is a palindrome. Also finds the longest palindromic substring.',
});

const page = () => {
  return (
    <>
      <PalindromeChecker />
    </>
  );
};

export default page;
