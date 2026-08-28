import { JsonToRustStruct } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'JSON to Rust Struct Generator', description: 'Free online JSON to Rust struct generator. Generate Rust struct definitions with serde from JSON.' };
const page = () => <JsonToRustStruct />;
export default page;
