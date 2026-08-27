export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

export function mergeJsonStrings(json1: string, json2: string): string {
  const obj1 = JSON.parse(json1);
  const obj2 = JSON.parse(json2);
  if (typeof obj1 !== 'object' || Array.isArray(obj1) || obj1 === null) throw new Error('First JSON must be an object');
  if (typeof obj2 !== 'object' || Array.isArray(obj2) || obj2 === null) throw new Error('Second JSON must be an object');
  const merged = deepMerge(obj1 as Record<string, unknown>, obj2 as Record<string, unknown>);
  return JSON.stringify(merged, null, 2);
}
