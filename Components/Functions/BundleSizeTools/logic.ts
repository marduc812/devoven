export interface PackageInfo {
  name: string;
  minGzip: number; // bytes
  treeShakeable: boolean;
  category: string;
  description: string;
}

// Sizes are approximate minified+gzipped sizes in bytes (2024 data)
export const PACKAGE_DATABASE: PackageInfo[] = [
  // React ecosystem
  { name: 'react', minGzip: 6400, treeShakeable: false, category: 'Framework', description: 'React library (runtime only)' },
  { name: 'react-dom', minGzip: 42000, treeShakeable: false, category: 'Framework', description: 'React DOM renderer' },
  { name: 'next', minGzip: 85000, treeShakeable: false, category: 'Framework', description: 'Next.js framework (client bundle)' },
  { name: 'react-router', minGzip: 13000, treeShakeable: true, category: 'Routing', description: 'React Router v6' },
  { name: 'react-router-dom', minGzip: 21000, treeShakeable: true, category: 'Routing', description: 'React Router DOM bindings' },
  { name: 'react-query', minGzip: 12000, treeShakeable: true, category: 'Data Fetching', description: 'React Query / TanStack Query v4' },
  { name: '@tanstack/react-query', minGzip: 12500, treeShakeable: true, category: 'Data Fetching', description: 'TanStack Query v5 for React' },
  { name: 'swr', minGzip: 4200, treeShakeable: true, category: 'Data Fetching', description: 'Stale-while-revalidate data fetching' },
  { name: 'recoil', minGzip: 21000, treeShakeable: false, category: 'State', description: 'Recoil state management' },
  { name: 'zustand', minGzip: 1100, treeShakeable: true, category: 'State', description: 'Zustand state management' },
  { name: 'jotai', minGzip: 2800, treeShakeable: true, category: 'State', description: 'Jotai atomic state management' },
  { name: 'redux', minGzip: 5600, treeShakeable: true, category: 'State', description: 'Redux core library' },
  { name: '@reduxjs/toolkit', minGzip: 37000, treeShakeable: true, category: 'State', description: 'Redux Toolkit' },
  { name: 'react-redux', minGzip: 6600, treeShakeable: true, category: 'State', description: 'React bindings for Redux' },
  { name: 'mobx', minGzip: 16500, treeShakeable: true, category: 'State', description: 'MobX state management' },
  { name: 'mobx-react-lite', minGzip: 4500, treeShakeable: true, category: 'State', description: 'Lightweight MobX React bindings' },
  { name: 'valtio', minGzip: 2700, treeShakeable: true, category: 'State', description: 'Proxy-based state management' },
  // Vue ecosystem
  { name: 'vue', minGzip: 22800, treeShakeable: true, category: 'Framework', description: 'Vue 3 runtime' },
  { name: 'pinia', minGzip: 1900, treeShakeable: true, category: 'State', description: 'Vue store (Pinia)' },
  { name: 'vue-router', minGzip: 12300, treeShakeable: true, category: 'Routing', description: 'Vue Router v4' },
  // Angular
  { name: '@angular/core', minGzip: 62000, treeShakeable: true, category: 'Framework', description: 'Angular core' },
  { name: '@angular/common', minGzip: 34000, treeShakeable: true, category: 'Framework', description: 'Angular common utilities' },
  // Svelte
  { name: 'svelte', minGzip: 1800, treeShakeable: true, category: 'Framework', description: 'Svelte (compile-time framework)' },
  // UI Libraries
  { name: '@mui/material', minGzip: 94000, treeShakeable: true, category: 'UI', description: 'Material UI component library' },
  { name: '@mui/icons-material', minGzip: 550000, treeShakeable: true, category: 'UI', description: 'MUI icons (tree-shake to use only needed icons)' },
  { name: 'antd', minGzip: 180000, treeShakeable: true, category: 'UI', description: 'Ant Design component library' },
  { name: '@chakra-ui/react', minGzip: 62000, treeShakeable: true, category: 'UI', description: 'Chakra UI component library' },
  { name: '@mantine/core', minGzip: 55000, treeShakeable: true, category: 'UI', description: 'Mantine UI components' },
  { name: '@headlessui/react', minGzip: 5900, treeShakeable: true, category: 'UI', description: 'Headless accessible UI components' },
  { name: '@radix-ui/react-dialog', minGzip: 3200, treeShakeable: true, category: 'UI', description: 'Radix UI Dialog primitive' },
  { name: 'bootstrap', minGzip: 22500, treeShakeable: false, category: 'UI', description: 'Bootstrap CSS framework (JS bundle)' },
  // Utilities
  { name: 'lodash', minGzip: 24500, treeShakeable: false, category: 'Utility', description: 'Lodash utility library (full build - prefer lodash-es)' },
  { name: 'lodash-es', minGzip: 24000, treeShakeable: true, category: 'Utility', description: 'Lodash ES modules (tree-shakeable)' },
  { name: 'ramda', minGzip: 12200, treeShakeable: true, category: 'Utility', description: 'Ramda functional utilities' },
  { name: 'date-fns', minGzip: 5200, treeShakeable: true, category: 'Date', description: 'date-fns date utilities (per function, tree-shakeable)' },
  { name: 'moment', minGzip: 66800, treeShakeable: false, category: 'Date', description: 'Moment.js (deprecated for new projects)' },
  { name: 'dayjs', minGzip: 2900, treeShakeable: false, category: 'Date', description: 'Day.js lightweight date library' },
  { name: 'luxon', minGzip: 20700, treeShakeable: false, category: 'Date', description: 'Luxon date/time library' },
  { name: 'uuid', minGzip: 1200, treeShakeable: true, category: 'Utility', description: 'UUID generation' },
  { name: 'nanoid', minGzip: 400, treeShakeable: true, category: 'Utility', description: 'Nanoid unique ID generator' },
  { name: 'classnames', minGzip: 350, treeShakeable: false, category: 'Utility', description: 'classnames utility' },
  { name: 'clsx', minGzip: 280, treeShakeable: true, category: 'Utility', description: 'clsx utility (smaller classnames alternative)' },
  // HTTP
  { name: 'axios', minGzip: 11300, treeShakeable: false, category: 'HTTP', description: 'Axios HTTP client' },
  { name: 'node-fetch', minGzip: 2900, treeShakeable: false, category: 'HTTP', description: 'node-fetch polyfill' },
  { name: 'ky', minGzip: 2600, treeShakeable: true, category: 'HTTP', description: 'Ky tiny fetch wrapper' },
  // Forms
  { name: 'react-hook-form', minGzip: 8500, treeShakeable: true, category: 'Forms', description: 'React Hook Form' },
  { name: 'formik', minGzip: 15200, treeShakeable: false, category: 'Forms', description: 'Formik form library' },
  { name: 'yup', minGzip: 12400, treeShakeable: true, category: 'Validation', description: 'Yup validation schema' },
  { name: 'zod', minGzip: 12900, treeShakeable: true, category: 'Validation', description: 'Zod TypeScript-first validation' },
  // Animation
  { name: 'framer-motion', minGzip: 43000, treeShakeable: true, category: 'Animation', description: 'Framer Motion animation library' },
  { name: 'gsap', minGzip: 26000, treeShakeable: true, category: 'Animation', description: 'GSAP animation platform' },
  { name: '@react-spring/web', minGzip: 16000, treeShakeable: true, category: 'Animation', description: 'React Spring animations' },
  // Charts
  { name: 'chart.js', minGzip: 60000, treeShakeable: true, category: 'Charts', description: 'Chart.js (with all chart types)' },
  { name: 'recharts', minGzip: 39000, treeShakeable: true, category: 'Charts', description: 'Recharts for React' },
  { name: 'd3', minGzip: 53000, treeShakeable: true, category: 'Charts', description: 'D3.js full bundle' },
  { name: 'victory', minGzip: 61000, treeShakeable: true, category: 'Charts', description: 'Victory charts for React' },
  { name: 'apexcharts', minGzip: 115000, treeShakeable: false, category: 'Charts', description: 'ApexCharts' },
  // CSS-in-JS
  { name: 'styled-components', minGzip: 13600, treeShakeable: false, category: 'CSS-in-JS', description: 'styled-components' },
  { name: '@emotion/react', minGzip: 8300, treeShakeable: true, category: 'CSS-in-JS', description: 'Emotion CSS-in-JS' },
  { name: '@emotion/styled', minGzip: 3900, treeShakeable: true, category: 'CSS-in-JS', description: 'Emotion styled API' },
  // Internationalization
  { name: 'i18next', minGzip: 9200, treeShakeable: true, category: 'i18n', description: 'i18next internationalization' },
  { name: 'react-i18next', minGzip: 6800, treeShakeable: true, category: 'i18n', description: 'React bindings for i18next' },
  // GraphQL
  { name: '@apollo/client', minGzip: 33000, treeShakeable: true, category: 'GraphQL', description: 'Apollo GraphQL client' },
  { name: 'graphql', minGzip: 14800, treeShakeable: true, category: 'GraphQL', description: 'GraphQL reference implementation' },
  // Testing
  { name: 'jest', minGzip: 0, treeShakeable: false, category: 'Testing', description: 'Jest (dev only, no bundle impact)' },
  { name: '@testing-library/react', minGzip: 0, treeShakeable: false, category: 'Testing', description: 'React Testing Library (dev only)' },
  // Build tools
  { name: 'webpack', minGzip: 0, treeShakeable: false, category: 'Build', description: 'Webpack (build tool, no bundle impact)' },
  { name: 'vite', minGzip: 0, treeShakeable: false, category: 'Build', description: 'Vite (build tool, no bundle impact)' },
  // Misc
  { name: 'immer', minGzip: 4600, treeShakeable: true, category: 'Utility', description: 'Immer immutable state helper' },
  { name: 'rxjs', minGzip: 11000, treeShakeable: true, category: 'Reactive', description: 'RxJS (tree-shake individual operators)' },
  { name: 'socket.io-client', minGzip: 13800, treeShakeable: false, category: 'Realtime', description: 'Socket.IO client' },
  { name: 'three', minGzip: 160000, treeShakeable: true, category: '3D', description: 'Three.js 3D library' },
  { name: '@react-three/fiber', minGzip: 20000, treeShakeable: true, category: '3D', description: 'React Three Fiber' },
  { name: 'lottie-web', minGzip: 52000, treeShakeable: false, category: 'Animation', description: 'Lottie web animations' },
  { name: 'highlight.js', minGzip: 32000, treeShakeable: true, category: 'Code', description: 'Syntax highlighting (core, no languages)' },
  { name: 'prismjs', minGzip: 6000, treeShakeable: false, category: 'Code', description: 'PrismJS syntax highlighting (core)' },
  { name: 'marked', minGzip: 6700, treeShakeable: true, category: 'Markdown', description: 'Marked markdown parser' },
  { name: 'react-markdown', minGzip: 7200, treeShakeable: true, category: 'Markdown', description: 'React Markdown renderer' },
  { name: '@codemirror/view', minGzip: 36000, treeShakeable: true, category: 'Editor', description: 'CodeMirror view layer' },
  { name: 'monaco-editor', minGzip: 1200000, treeShakeable: false, category: 'Editor', description: 'Monaco Editor (VS Code editor — load async!)' },
  { name: 'quill', minGzip: 43000, treeShakeable: false, category: 'Editor', description: 'Quill rich text editor' },
  { name: 'dnd-kit', minGzip: 9600, treeShakeable: true, category: 'DnD', description: 'dnd-kit drag and drop core' },
  { name: 'react-beautiful-dnd', minGzip: 34000, treeShakeable: false, category: 'DnD', description: 'react-beautiful-dnd (deprecated)' },
  { name: 'react-virtualized', minGzip: 28000, treeShakeable: true, category: 'Performance', description: 'react-virtualized virtual scroll' },
  { name: 'react-window', minGzip: 6100, treeShakeable: true, category: 'Performance', description: 'react-window (smaller virtualization)' },
  { name: 'crypto-js', minGzip: 43000, treeShakeable: false, category: 'Crypto', description: 'CryptoJS (use Web Crypto API instead)' },
  { name: 'jwt-decode', minGzip: 1100, treeShakeable: true, category: 'Auth', description: 'JWT decode utility' },
  { name: 'qs', minGzip: 2300, treeShakeable: false, category: 'Utility', description: 'qs query string parser' },
  { name: 'query-string', minGzip: 2800, treeShakeable: true, category: 'Utility', description: 'query-string URL parser' },
  { name: 'dotenv', minGzip: 0, treeShakeable: false, category: 'Build', description: 'dotenv (server only, no browser bundle)' },
  { name: 'joi', minGzip: 23000, treeShakeable: false, category: 'Validation', description: 'Joi validation (prefer Zod in browser)' },
  { name: 'validator', minGzip: 10200, treeShakeable: true, category: 'Validation', description: 'Validator.js string validation' },
  { name: 'numeral', minGzip: 4000, treeShakeable: false, category: 'Utility', description: 'Numeral.js number formatting' },
  { name: 'currency.js', minGzip: 980, treeShakeable: false, category: 'Utility', description: 'Currency.js formatting' },
  { name: 'color', minGzip: 3400, treeShakeable: false, category: 'Utility', description: 'Color parsing/conversion' },
  { name: 'chroma-js', minGzip: 13700, treeShakeable: false, category: 'Utility', description: 'Chroma.js color manipulation' },
  { name: 'fuse.js', minGzip: 3800, treeShakeable: false, category: 'Search', description: 'Fuse.js fuzzy search' },
  { name: 'downshift', minGzip: 9500, treeShakeable: true, category: 'UI', description: 'Downshift combobox/autocomplete' },
  { name: 'react-select', minGzip: 27000, treeShakeable: true, category: 'UI', description: 'React Select component' },
  { name: 'react-table', minGzip: 5700, treeShakeable: true, category: 'UI', description: 'React Table / TanStack Table v7' },
  { name: '@tanstack/react-table', minGzip: 14500, treeShakeable: true, category: 'UI', description: 'TanStack Table v8' },
  { name: 'react-datepicker', minGzip: 22000, treeShakeable: false, category: 'UI', description: 'React DatePicker' },
  { name: 'react-toastify', minGzip: 7800, treeShakeable: true, category: 'UI', description: 'React Toastify notifications' },
  { name: 'sonner', minGzip: 3200, treeShakeable: true, category: 'UI', description: 'Sonner toast notifications' },
  { name: 'react-hot-toast', minGzip: 3400, treeShakeable: true, category: 'UI', description: 'React Hot Toast' },
];

export interface PackageLookup {
  name: string;
  info: PackageInfo | null;
}

export function lookupPackages(input: string): PackageLookup[] {
  const lines = input.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean);
  return lines.map(name => ({
    name,
    info: PACKAGE_DATABASE.find(p => p.name.toLowerCase() === name) || null,
  }));
}

export interface BundleResult {
  packages: Array<{ name: string; info: PackageInfo | null }>;
  totalBytes: number;
  found: number;
  notFound: number;
  impact: 'small' | 'medium' | 'large' | 'very-large';
  impactLabel: string;
  warnings: string[];
}

export function estimateBundle(input: string): BundleResult {
  const packages = lookupPackages(input);
  const found = packages.filter(p => p.info !== null);
  const notFound = packages.filter(p => p.info === null);
  const totalBytes = found.reduce((sum, p) => sum + (p.info?.minGzip ?? 0), 0);

  let impact: BundleResult['impact'];
  let impactLabel: string;
  if (totalBytes < 50000) { impact = 'small'; impactLabel = 'Small (< 50 KB)'; }
  else if (totalBytes < 150000) { impact = 'medium'; impactLabel = 'Medium (50–150 KB)'; }
  else if (totalBytes < 400000) { impact = 'large'; impactLabel = 'Large (150–400 KB)'; }
  else { impact = 'very-large'; impactLabel = 'Very Large (> 400 KB)'; }

  const warnings: string[] = [];
  if (found.some(p => p.info?.name === 'moment')) {
    warnings.push('moment is deprecated — consider date-fns or dayjs instead (much smaller).');
  }
  if (found.some(p => p.info?.name === 'lodash')) {
    warnings.push('Use lodash-es with tree-shaking, or import specific functions: import debounce from "lodash/debounce".');
  }
  if (found.some(p => p.info?.name === 'monaco-editor')) {
    warnings.push('monaco-editor is 1.2 MB — always load it asynchronously and split it into a separate chunk.');
  }
  if (found.some(p => p.info?.name === '@mui/icons-material')) {
    warnings.push('@mui/icons-material has 550 KB of icons — always tree-shake by importing individual icons.');
  }
  if (found.some(p => p.info?.name === 'crypto-js')) {
    warnings.push('crypto-js is deprecated — use the built-in Web Crypto API (window.crypto.subtle) instead.');
  }

  return {
    packages,
    totalBytes,
    found: found.length,
    notFound: notFound.length,
    impact,
    impactLabel,
    warnings,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
