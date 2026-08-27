import { BarcodeInfo } from '@/Components/Functions/BarcodeInfoTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barcode Decoder | DevOven',
  description: 'Decode EAN-13 and UPC-A barcodes. Validates the check digit, identifies GS1 prefix country or company, and distinguishes ISBN-13, ISSN, and ISMN from standard EAN-13.',
};

const page = () => <BarcodeInfo />;
export default page;
