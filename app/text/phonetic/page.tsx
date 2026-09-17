import { PhoneticAlphabetConverter } from '@/Components/Functions/PhoneticAlphabetTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/text/phonetic', {
  title: 'Phonetic Alphabet Converter — NATO, ICAO & More | DevOven',
  description: 'Convert text to NATO phonetic alphabet (Alpha, Bravo, Charlie) and back. Also supports ICAO, Old British, and German phonetic alphabets. Instant Phonetic Alphabet conversion.',
});

const page = () => {
  return (
    <>
      <PhoneticAlphabetConverter />
    </>
  );
};

export default page;
