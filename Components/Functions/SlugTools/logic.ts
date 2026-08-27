export function toSlug(text: string, separator = '-'): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[-_]+/g, ' ')          // Treat hyphens/underscores as word separators
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, separator)
    .replace(new RegExp(`${separator === '-' ? '\\-' : separator}+`, 'g'), separator);
}

export function toSnakeCase(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

export function toCamelCase(text: string): string {
  const slug = toSlug(text);
  return slug.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

export function toPascalCase(text: string): string {
  const camel = toCamelCase(text);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toKebabCase(text: string): string {
  return toSlug(text, '-');
}

export function toConstantCase(text: string): string {
  return toSnakeCase(text).toUpperCase();
}

export function formatSlugVariants(text: string): string {
  return [
    `slug (kebab-case):   ${toKebabCase(text)}`,
    `snake_case:          ${toSnakeCase(text)}`,
    `camelCase:           ${toCamelCase(text)}`,
    `PascalCase:          ${toPascalCase(text)}`,
    `CONSTANT_CASE:       ${toConstantCase(text)}`,
  ].join('\n');
}
