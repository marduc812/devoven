import { QrDataDecoder } from '@/Components/Functions/QrDataTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/qr-data', {
    title: 'QR Data Analyzer - Parse QR Code Content',
    description: 'Paste the text content of a QR code to identify its type and extract structured data. Supports URLs, vCard contacts, WiFi credentials, geo coordinates, email, phone, SMS, and calendar events.',
});

const page = () => {
    return (
        <>
            <QrDataDecoder />
        </>
    );
};

export default page;
