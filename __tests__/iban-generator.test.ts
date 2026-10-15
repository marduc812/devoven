import { IBAN_COUNTRIES, exportIbans, formatIban, generateIbans, getCountry, ibanCheckDigits, ibanLength, mod97 } from '@/Components/Functions/IbanGeneratorTools/logic';

describe('IBAN generator', () => {
  it.each([
    ['DE', '700100808773789954', '17'],
    ['GB', 'WEST12345698765432', '82'],
    ['FR', '20041010050500013M02606', '14'],
    ['ES', '21000418450200051332', '91'],
  ])('calculates published or supplied check digits for %s', (code, bban, expected) => {
    expect(ibanCheckDigits(code, bban)).toBe(expected);
  });

  it.each(IBAN_COUNTRIES)('generates correct lengths, character classes and MOD-97 for $code', country => {
    const regex = new RegExp('^' + country.pattern.replace(/(\d+)([nac])/g, (_, length, kind) => `${{ n: '[0-9]', a: '[A-Z]', c: '[A-Z0-9]' }[kind as 'n' | 'a' | 'c']}{${length}}`) + '$');
    for (const iban of generateIbans(country.code, 20)) {
      expect(iban.startsWith(country.code)).toBe(true);
      expect(iban.length).toBe(ibanLength(country));
      expect(iban.slice(4)).toMatch(regex);
      // Independent BigInt calculation catches precision errors and letter conversion mistakes.
      const rearranged = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, char => String(char.charCodeAt(0) - 55));
      expect(BigInt(rearranged) % 97n).toBe(1n);
    }
  });

  it('preserves reserved zero positions', () => {
    generateIbans('TR', 20).forEach(iban => expect(iban[9]).toBe('0'));
    generateIbans('CR', 20).forEach(iban => expect(iban[4]).toBe('0'));
  });

  it.each([0, -1, 101, 1.5, NaN, Infinity])('rejects invalid quantity %s', quantity => {
    expect(() => generateIbans('DE', quantity)).toThrow('whole number');
  });

  it('supports the batch limit and rejects unknown countries', () => {
    expect(generateIbans('DE', 100)).toHaveLength(100);
    expect(() => getCountry('XX')).toThrow('supported country');
    expect(() => mod97('bad!')).toThrow();
  });

  it('formats for display and exports raw values', () => {
    const values = ['DE17700100808773789954', 'GB82WEST12345698765432'];
    expect(formatIban(values[0])).toBe('DE17 7001 0080 8773 7899 54');
    expect(exportIbans(values, 'txt')).toBe(values.join('\n') + '\n');
    expect(exportIbans(values, 'csv')).toBe('IBAN\r\n' + values.join('\r\n') + '\r\n');
    expect(JSON.parse(exportIbans(values, 'json'))).toEqual({ ibans: values });
  });
});
