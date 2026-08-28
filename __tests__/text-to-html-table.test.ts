import { textToHtmlTable } from '@/Components/Functions/TextToHtmlTableTools/logic';
describe('textToHtmlTable', () => {
  it('creates table from CSV', () => {
    const r = textToHtmlTable('name,age\nAlice,30\nBob,25', 'comma');
    expect(r).toContain('<table');
    expect(r).toContain('<th>name</th>');
    expect(r).toContain('<td>Alice</td>');
  });
  it('creates table from TSV', () => {
    const r = textToHtmlTable('name\tage\nAlice\t30', 'tab');
    expect(r).toContain('<th>name</th>');
  });
  it('creates table from pipe-delimited', () => {
    const r = textToHtmlTable('a|b\n1|2', 'pipe');
    expect(r).toContain('<th>a</th>');
  });
  it('escapes HTML in cell content', () => {
    const r = textToHtmlTable('a,b\n<script>,2', 'comma');
    expect(r).toContain('&lt;script&gt;');
    expect(r).not.toContain('<script>');
  });
  it('auto-detects delimiter', () => {
    const r = textToHtmlTable('a,b,c\n1,2,3', 'auto');
    expect(r).toContain('<th>a</th>');
  });
  it('throws for empty input', () => expect(() => textToHtmlTable('')).toThrow());
  it('generates thead and tbody', () => {
    const r = textToHtmlTable('h1,h2\nd1,d2', 'comma');
    expect(r).toContain('<thead>');
    expect(r).toContain('<tbody>');
  });
});
