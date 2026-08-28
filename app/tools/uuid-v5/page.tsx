import { UuidV5Generator } from '@/Components/Functions/UuidV5Tools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'UUID v5 Generator - Name-based SHA-1 UUID',
    description: 'Generate deterministic UUID v5 values using a namespace and name. Same inputs always produce the same UUID. Uses SHA-1 hashing per RFC 4122. Supports DNS, URL, OID, and X500 standard namespaces.',
};

const page = () => {
    return (
        <>
            <UuidV5Generator />
        </>
    );
};

export default page;
