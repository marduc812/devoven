import { defangText, fangText, findIndicators } from '@/Components/Functions/DefangTools/logic';

describe('defangText', () => {
  it('defangs a URL', () => {
    expect(defangText('http://evil.com')).toBe('hxxp://evil[.]com');
  });

  it('defangs https and keeps the path', () => {
    expect(defangText('https://evil.com/a.php?x=1')).toBe('hxxps://evil[.]com/a[.]php?x=1');
  });

  it('defangs an IPv4 address', () => {
    expect(defangText('192.168.1.1')).toBe('192[.]168[.]1[.]1');
  });

  it('defangs an IPv6 address with bracketed colons', () => {
    expect(defangText('2001:db8:0:0:0:0:0:1')).toBe('2001[:]db8[:]0[:]0[:]0[:]0[:]0[:]1');
  });

  it('defangs an email address', () => {
    expect(defangText('phish@evil.com')).toBe('phish[@]evil[.]com');
  });

  it('defangs a bare domain', () => {
    expect(defangText('go to evil.com now')).toBe('go to evil[.]com now');
  });

  it('leaves the surrounding sentence alone', () => {
    expect(defangText('Seen at http://evil.com. Blocked.')).toBe('Seen at hxxp://evil[.]com. Blocked.');
  });

  it('does not touch filenames', () => {
    expect(defangText('dropped invoice.pdf and run.exe')).toBe('dropped invoice.pdf and run.exe');
  });

  it('honours the parenthesis dot style', () => {
    expect(defangText('evil.com', { dotStyle: 'parens' })).toBe('evil(.)com');
  });

  it('honours the word dot style', () => {
    expect(defangText('evil.com', { dotStyle: 'word' })).toBe('evil[dot]com');
  });

  it('can escape the scheme separator', () => {
    expect(defangText('http://evil.com', { separator: true })).toBe('hxxp[://]evil[.]com');
  });

  it('can leave the scheme intact', () => {
    expect(defangText('http://evil.com', { scheme: false })).toBe('http://evil[.]com');
  });

  it('can leave the at sign intact', () => {
    expect(defangText('phish@evil.com', { at: false })).toBe('phish@evil[.]com');
  });

  it('escapes every dot in everything scope', () => {
    expect(defangText('End. http://evil.com', { scope: 'everything' })).toBe('End[.] hxxp://evil[.]com');
  });

  it('defangs ftp', () => {
    expect(defangText('ftp://evil.com')).toBe('fxp://evil[.]com');
  });

  it('returns an empty string for empty input', () => {
    expect(defangText('')).toBe('');
  });
});

describe('fangText', () => {
  it('fangs the canonical form', () => {
    expect(fangText('hxxp://evil[.]com')).toBe('http://evil.com');
  });

  it('fangs hxxps', () => {
    expect(fangText('hxxps://evil[.]com')).toBe('https://evil.com');
  });

  it('fangs a bracketed separator', () => {
    expect(fangText('hxxp[://]evil[.]com')).toBe('http://evil.com');
  });

  it('fangs a bracketed colon before the slashes', () => {
    expect(fangText('hxxp[:]//evil[.]com')).toBe('http://evil.com');
  });

  it('fangs parenthesis and word dots', () => {
    expect(fangText('evil(.)com and evil[dot]com')).toBe('evil.com and evil.com');
  });

  it('fangs a defanged at sign', () => {
    expect(fangText('phish[@]evil[.]com')).toBe('phish@evil.com');
    expect(fangText('phish[at]evil[dot]com')).toBe('phish@evil.com');
  });

  it('fangs h**p and h__p', () => {
    expect(fangText('h**p://evil[.]com')).toBe('http://evil.com');
    expect(fangText('h__ps://evil[.]com')).toBe('https://evil.com');
  });

  it('fangs an uppercase hXXp', () => {
    expect(fangText('hXXP://evil[.]com')).toBe('http://evil.com');
  });

  it('fangs an IPv6 address', () => {
    expect(fangText('2001[:]db8[:][:]1')).toBe('2001:db8::1');
  });

  it('tolerates spaces inside the brackets', () => {
    expect(fangText('evil[ . ]com')).toBe('evil.com');
  });

  it('round-trips', () => {
    const original = 'Contact phish@evil.com or visit https://bad.example.org/x from 10.0.0.5';
    expect(fangText(defangText(original))).toBe(original);
  });
});

describe('findIndicators', () => {
  it('lists unique indicators', () => {
    const text = 'http://evil.com hit 10.0.0.1 and evil.com again';
    expect(findIndicators(text)).toEqual(['http://evil.com', '10.0.0.1', 'evil.com']);
  });

  it('ignores filenames', () => {
    expect(findIndicators('setup.exe')).toEqual([]);
  });
});
