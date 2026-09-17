import { JwkInspector } from '@/Components/Functions/JwkInspectorTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/encoding/jwk', {
  title: 'JWK Inspector - DevOven',
  description: 'Parse and inspect JSON Web Keys (JWK) and JSON Web Key Sets (JWKS). View key type, algorithm, use, key ID, modulus size for RSA keys, curve for EC keys, and symmetric key length.',
});

const page = () => <JwkInspector />;
export default page;
