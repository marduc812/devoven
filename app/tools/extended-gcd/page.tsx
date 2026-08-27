import type { Metadata } from 'next';
import { ExtendedGcd } from '@/Components/Functions/ExtendedGcdTools';

export const metadata: Metadata = {
  title: 'Extended Euclidean Algorithm | DevOven',
  description: 'Compute the GCD of two integers and find Bézout coefficients x, y such that ax + by = gcd(a, b). Also calculates modular inverses.',
};

export default function Page() {
  return <ExtendedGcd />;
}
