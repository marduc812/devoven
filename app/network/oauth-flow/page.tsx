import { OAuthFlowBuilder } from '@/Components/Functions/OAuthFlowTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';
export const metadata: Metadata = toolMetadata('/network/oauth-flow', { title: 'OAuth 2.0 Flow Builder', description: 'Build OAuth 2.0 authorization URLs, understand grant type flows, and decode JWT access tokens.' });
const page = () => <OAuthFlowBuilder />;
export default page;
