import { FenParser } from '@/Components/Functions/FenParserTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/fen-parser', {
  title: 'Chess FEN Parser | DevOven',
  description: 'Parse and explain chess FEN (Forsyth-Edwards Notation) strings. Shows ASCII board, active color, castling rights, en passant, material count, and check detection.',
});

const page = () => <FenParser />;
export default page;
