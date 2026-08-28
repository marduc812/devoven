import { Sign2nTool } from '@/Components/Functions/Sign2nTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT Public Key Recovery (sign2n) | DevOven',
  description:
    'Recover the RSA public key from two RS256/RS384/RS512 JWTs signed by the same key — no public key needed. Computes gcd(s₁ᵉ−m₁, s₂ᵉ−m₂) to factor out the modulus, then hands off to the JWT Editor for RS→HS algorithm-confusion forgery. Runs entirely in your browser.',
};

const page = () => <Sign2nTool />;
export default page;
