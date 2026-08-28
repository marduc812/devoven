export type NormalizationForm = 'NFC' | 'NFD' | 'NFKC' | 'NFKD';

export function normalizeText(text: string, form: NormalizationForm): string {
  return text.normalize(form);
}

export function getAllForms(text: string): string {
  const forms: NormalizationForm[] = ['NFC', 'NFD', 'NFKC', 'NFKD'];
  return forms.map(f => {
    const normalized = text.normalize(f);
    const changed = normalized !== text;
    return `${f}: ${normalized}${changed ? ' (changed)' : ' (unchanged)'}`;
  }).join('\n');
}

export function getFormDescription(form: NormalizationForm): string {
  const descriptions: Record<NormalizationForm, string> = {
    NFC: 'Canonical Decomposition, followed by Canonical Composition. Most common form for web.',
    NFD: 'Canonical Decomposition. Decomposes combined characters into base + combining marks.',
    NFKC: 'Compatibility Decomposition, followed by Canonical Composition. Converts compatibility characters (e.g. ligatures) to their equivalents.',
    NFKD: 'Compatibility Decomposition. Like NFD but also decomposes compatibility characters.',
  };
  return descriptions[form];
}
