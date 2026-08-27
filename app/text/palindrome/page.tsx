import { PalindromeChecker } from '@/Components/Functions/PalindromeTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Palindrome Checker — Check Words & Phrases | DevOven',
  description: 'Check if a word or phrase is a palindrome. Also finds the longest palindromic substring.',
};

const page = () => {
  return (
    <>
      <PalindromeChecker />
    </>
  );
};

export default page;
