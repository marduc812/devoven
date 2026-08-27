export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';

export type BadgeConfig = {
  label: string;
  message: string;
  color: string;
  labelColor: string;
  style: BadgeStyle;
  logo: string;
  link: string;
};

export function generateShieldsUrl(config: BadgeConfig): string {
  const base = 'https://img.shields.io/badge';
  const label = encodeURIComponent(config.label.replace(/-/g, '--').replace(/_/g, '__'));
  const message = encodeURIComponent(config.message.replace(/-/g, '--').replace(/_/g, '__'));
  const color = config.color.replace('#', '');

  let url = `${base}/${label}-${message}-${color}`;
  const params: string[] = [];
  if (config.style !== 'flat') params.push(`style=${config.style}`);
  if (config.labelColor) params.push(`labelColor=${config.labelColor.replace('#', '')}`);
  if (config.logo) params.push(`logo=${encodeURIComponent(config.logo)}`);
  if (params.length) url += '?' + params.join('&');
  return url;
}

export function generateMarkdownBadge(config: BadgeConfig): string {
  const url = generateShieldsUrl(config);
  const alt = `${config.label}: ${config.message}`;
  const img = `![${alt}](${url})`;
  return config.link ? `[${img}](${config.link})` : img;
}

export const BADGE_PRESETS: { name: string; config: Partial<BadgeConfig> }[] = [
  { name: 'License MIT', config: { label: 'license', message: 'MIT', color: 'blue' } },
  { name: 'TypeScript', config: { label: 'TypeScript', message: '5.0', color: '3178C6', logo: 'typescript' } },
  { name: 'React', config: { label: 'React', message: '18', color: '61DAFB', logo: 'react' } },
  { name: 'Node.js', config: { label: 'Node.js', message: '22', color: '339933', logo: 'node.js' } },
  { name: 'npm version', config: { label: 'npm', message: 'v1.0.0', color: 'CB3837', logo: 'npm' } },
  { name: 'GitHub stars', config: { label: 'GitHub stars', message: '1k', color: 'yellow', logo: 'github' } },
  { name: 'Build passing', config: { label: 'build', message: 'passing', color: 'brightgreen' } },
  { name: 'Coverage', config: { label: 'coverage', message: '95%', color: 'green' } },
  { name: 'PRs Welcome', config: { label: 'PRs', message: 'welcome', color: 'brightgreen' } },
  { name: 'Docker', config: { label: 'Docker', message: 'ready', color: '2496ED', logo: 'docker' } },
];

export function formatBadgeOutput(config: BadgeConfig): string {
  const markdown = generateMarkdownBadge(config);
  const url = generateShieldsUrl(config);
  return `Markdown:\n${markdown}\n\nImage URL:\n${url}\n\nHTML:\n<img src="${url}" alt="${config.label}: ${config.message}">`;
}
