import { BarcodeGenerator } from '@/Components/Functions/Generators';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Barcode Generator — CODE128, EAN-13, UPC | DevOven',
  description: 'Generate CODE128, EAN-13, and UPC barcodes as SVG in your browser. Free and instant.',
};

const page = () => {
  return (
    <>
      <BarcodeGenerator />
    </>
  );
};

export default page;
