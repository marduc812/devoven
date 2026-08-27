import { QrCodeGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Code Generator — URL, Text, vCard | DevOven',
  description: 'Generate QR codes from URLs, text, or vCard contact info entirely in your browser. Download as PNG.',
};

const page = () => {
  return (
    <>
      <QrCodeGenerator />
    </>
  );
};

export default page;
