import { IniParser } from '@/Components/Functions/IniParserTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'INI / Config File Parser — DevOven',
  description: 'Parse INI and config files to JSON or convert JSON back to INI format. Handles sections, key=value pairs, key: value syntax, comments, and quoted values.',
};

const page = () => <IniParser />;
export default page;
