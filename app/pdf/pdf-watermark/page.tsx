import { PdfWatermark } from '@/Components/Functions/PdfTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Watermark PDF",
  description:
    "Free online PDF watermarking tool. Stamp text such as CONFIDENTIAL or DRAFT across every page, with control over size, angle, colour and opacity. Runs entirely in your browser.",
};

const page = () => <PdfWatermark />;
export default page;
