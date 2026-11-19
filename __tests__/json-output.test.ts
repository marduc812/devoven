/** @jest-environment jsdom */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import JsonOutput from '@/Components/MainView/MainPanel/JsonOutput';

function render(value: string) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(createElement(JsonOutput, { value, label: 'Formatted JSON' }));
  return container;
}

it('distinguishes keys and value types while preserving the exact output', () => {
  const value = '{\n\t"key": ["true", -1.25e+10, true, false, null, {"nested": 9007199254740993}]\n}';
  const view = render(value);
  expect(view.textContent).toBe(value);
  expect(Array.from(view.querySelectorAll('span'), span => [span.textContent, span.className])).toEqual([
    ['"key"', 'text-sky-700'],
    ['"true"', 'text-emerald-700'],
    ['-1.25e+10', 'text-amber-700'],
    ['true', 'text-violet-700'],
    ['false', 'text-violet-700'],
    ['null', 'text-rose-700'],
    ['"nested"', 'text-sky-700'],
    ['9007199254740993', 'text-amber-700'],
  ]);
  expect(view.querySelector('[role="textbox"]')?.getAttribute('aria-label')).toBe('Formatted JSON');
});

it('keeps escaped quotes, backslashes, and HTML inside strings as literal text', () => {
  const value = JSON.stringify({ 'a"b': 'a\\b "quoted": true <img src=x onerror=alert(1)>' });
  const view = render(value);
  expect(view.textContent).toBe(value);
  expect(view.querySelectorAll('span')).toHaveLength(2);
  expect(view.querySelector('img')).toBeNull();
});

it.each(['', 'Error: Invalid JSON at position 12', '{"incomplete":', 'true trailing'])('leaves non-JSON output plain: %s', value => {
  const view = render(value);
  expect(view.textContent).toBe(value);
  expect(view.querySelector('span')).toBeNull();
});

it.each(['"hello"', '42', 'false', 'null', '[]', '{}'])('supports a top-level JSON value: %s', value => {
  expect(render(value).textContent).toBe(value);
});
