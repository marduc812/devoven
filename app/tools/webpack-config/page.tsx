import { WebpackConfigGenerator } from '@/Components/Functions/WebpackConfigTools';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webpack Config Generator | DevOven',
  description: 'Generate a webpack.config.js with appropriate loaders and plugins. Supports TypeScript, React, Babel, CSS Modules, Sass, asset modules, HtmlWebpackPlugin, and MiniCssExtractPlugin.',
};

const page = () => <WebpackConfigGenerator />;
export default page;
