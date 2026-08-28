import { OAuthFlowBuilder } from '@/Components/Functions/OAuthFlowTools';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'OAuth 2.0 Flow Builder', description: 'Build OAuth 2.0 authorization URLs, understand grant type flows, and decode JWT access tokens.' };
const page = () => <OAuthFlowBuilder />;
export default page;
