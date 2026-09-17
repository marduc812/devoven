import { WebpackConfigGenerator } from '@/Components/Functions/WebpackConfigTools';
import type { Metadata } from 'next';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/webpack-config', {
  title: 'Webpack Config Generator | DevOven',
  description: 'Generate a webpack.config.js with appropriate loaders and plugins. Supports TypeScript, React, Babel, CSS Modules, Sass, asset modules, HtmlWebpackPlugin, and MiniCssExtractPlugin.',
});

const page = () => <WebpackConfigGenerator />;
export default page;
