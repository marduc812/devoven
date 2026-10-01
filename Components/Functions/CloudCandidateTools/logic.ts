const MAX_CANDIDATES = 200;

/** Build a small, deterministic set of likely Azure Blob container names locally. */
export function generateAzureContainerCandidates(input: string): string[] {
  const seed = input.trim().toLowerCase();
  if (!seed) throw new Error('Enter a company, project, or domain name.');

  const words = seed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.[a-z]{2,}$/i, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  if (words.length === 0) throw new Error('Input must contain letters or numbers.');

  const base = words.join('');
  const variants = new Set<string>();
  const add = (candidate: string) => {
    const normalized = candidate.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (normalized.length >= 3 && normalized.length <= 63) variants.add(normalized);
  };

  for (const word of words) add(word);
  add(base);
  add(words.join('-'));

  const suffixes = ['dev', 'prod', 'test', 'stage', 'staging', 'data', 'assets', 'backup', 'static', 'public', 'files'];
  for (const suffix of suffixes) {
    add(`${base}${suffix}`);
    add(`${base}-${suffix}`);
  }

  const prefixes = ['dev', 'prod', 'test', 'stage', 'staging', 'data', 'assets', 'backup', 'static', 'public', 'files'];
  for (const prefix of prefixes) {
    add(`${prefix}${base}`);
    add(`${prefix}-${base}`);
  }

  return Array.from(variants).slice(0, MAX_CANDIDATES);
}

export function buildAzureContainerUrl(accountName: string, containerName: string): string {
  const account = accountName.trim().toLowerCase();
  const container = containerName.trim().toLowerCase();
  if (!/^[a-z0-9]{3,24}$/.test(account)) {
    throw new Error('Azure storage account names must be 3–24 lowercase letters or numbers.');
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(container) || container.includes('--')) {
    throw new Error('Container names must be 3–63 lowercase letters, numbers, or single hyphens.');
  }
  return `https://${account}.blob.core.windows.net/${container}`;
}
