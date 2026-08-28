import { textToMorse, morseToText } from '@/Components/Functions/MorseCodeTools/logic';
describe('textToMorse', () => {
  it('encodes SOS', () => expect(textToMorse('SOS')).toBe('... --- ...'));
  it('encodes A', () => expect(textToMorse('A')).toBe('.-'));
  it('encodes lowercase', () => expect(textToMorse('a')).toBe('.-'));
  it('encodes HI THERE', () => expect(textToMorse('HI THERE')).toBe('.... .. / - .... . .-. .'));
  it('encodes digits', () => expect(textToMorse('9')).toBe('----.'));
  it('unknown char gives ?', () => expect(textToMorse('~')).toBe('?'));
});
describe('morseToText', () => {
  it('decodes SOS', () => expect(morseToText('... --- ...')).toBe('SOS'));
  it('decodes with word separator', () => expect(morseToText('.... .. / - .... . .-. .')).toBe('HI THERE'));
  it('unknown code gives ?', () => expect(morseToText('.......')).toBe('?'));
});
