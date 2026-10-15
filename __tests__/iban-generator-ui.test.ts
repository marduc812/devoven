/** @jest-environment jsdom */

import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IbanGeneratorTools } from '@/Components/Functions/IbanGeneratorTools';

jest.mock('../Components/MainView/MainPanel/Panel', () => ({
  __esModule: true,
  default: ({ extraElements }: { extraElements: ReactNode }) => extraElements,
}));

let container: HTMLDivElement;
let root: Root;
const clipboard = jest.fn().mockResolvedValue(undefined);

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  clipboard.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(IbanGeneratorTools)); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

async function generate() {
  await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
}

async function country(code: string) {
  await act(async () => {
    const select = container.querySelector('select')!;
    select.value = code;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function quantity(value: string) {
  await act(async () => {
    const input = container.querySelector('input')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('colors and labels the number parts and copies the unformatted IBAN', async () => {
  await generate();
  const country = container.querySelector('span[title="Country code"]')!;
  const checks = container.querySelector('span[title="Check digits"]')!;
  const bban = container.querySelector('span[title="BBAN"]')!;
  expect(country.textContent).toBe('DE');
  expect(checks.textContent).toMatch(/^\d{2}$/);
  expect(country.className).not.toBe(checks.className);
  expect(bban.textContent!.replace(/ /g, '')).toHaveLength(18);
  await act(async () => { (container.querySelector('[aria-label="Copy IBAN"]') as HTMLButtonElement).click(); });
  expect(clipboard).toHaveBeenCalledWith(country.textContent! + checks.textContent! + bban.textContent!.replace(/ /g, ''));
});

it('keeps the result and its metadata until new settings are generated', async () => {
  await generate();
  const original = container.querySelector('[aria-label="Generated IBANs"]')!.textContent;
  await country('FR');
  await quantity('3');
  expect(container.textContent).toContain('Settings changed');
  expect(container.querySelector('span[title="Country code"]')!.textContent).toBe('DE');
  expect(container.querySelector('[aria-label="Generated IBANs"]')!.textContent).toContain('Germany');
  expect(original).toContain('22');
  await generate();
  expect(container.querySelector('span[title="Country code"]')!.textContent).toBe('FR');
  expect(container.querySelectorAll('ol li')).toHaveLength(3);
  expect(container.textContent).not.toContain('Settings changed');
  await act(async () => { (container.querySelector('[aria-label="Copy all IBANs"]') as HTMLButtonElement).click(); });
  const copied = clipboard.mock.calls[0][0].split('\n');
  expect(copied).toHaveLength(3);
  copied.forEach((iban: string) => expect(iban).toMatch(/^FR\d{12}[A-Z0-9]{11}\d{2}$/));
});

it('reports an invalid batch size without erasing a result', async () => {
  await generate();
  await quantity('101');
  await generate();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain('whole number from 1 to 100');
  expect(container.querySelector('span[title="Country code"]')!.textContent).toBe('DE');
});
