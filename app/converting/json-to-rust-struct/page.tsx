import { JsonToRustStruct } from '@/Components/Functions/DataFormatConverters';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/converting/json-to-rust-struct', { title: 'JSON to Rust Struct Generator', description: 'Free online JSON to Rust struct generator. Generate Rust struct definitions with serde from JSON.' });
const page = () => <JsonToRustStruct />;
export default page;
